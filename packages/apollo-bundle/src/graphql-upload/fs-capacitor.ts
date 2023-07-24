import { randomBytes } from "crypto";
import { read, open, closeSync, unlinkSync, write, close, unlink } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { Readable, ReadableOptions, Writable, WritableOptions } from "stream";
import { EventEmitter } from "events";

export class ReadAfterDestroyedError extends Error {}
export class ReadAfterReleasedError extends Error {}

export interface ReadStreamOptions {
  highWaterMark?: ReadableOptions["highWaterMark"];
  encoding?: ReadableOptions["encoding"];
}

// Use a “proxy” event emitter configured to have an infinite maximum number of
// listeners to prevent Node.js max listeners exceeded warnings if many
// `fs-capacitor` `ReadStream` instances are created at the same time. See:
// https://github.com/mike-marcacci/fs-capacitor/issues/30
const processExitProxy = new EventEmitter();
processExitProxy.setMaxListeners(Infinity);
process.once("exit", () => processExitProxy.emit("exit"));

export class ReadStream extends Readable {
  private _pos: number = 0;
  private _writeStream: WriteStream;

  constructor(writeStream: WriteStream, options?: ReadStreamOptions) {
    super({
      highWaterMark: options?.highWaterMark,
      encoding: options?.encoding,
      autoDestroy: true,
    });
    this._writeStream = writeStream;
  }

  _read(n: number): void {
    if (this.destroyed) return;

    if (typeof this._writeStream["_fd"] !== "number") {
      this._writeStream.once("ready", () => this._read(n));
      return;
    }

    // Using `allocUnsafe` here is OK because we return a slice the length of
    // `bytesRead`, and discard the rest. This prevents node from having to zero
    // out the entire allocation first.
    const buf = Buffer.allocUnsafe(n);
    read(this._writeStream["_fd"], buf, 0, n, this._pos, (error, bytesRead) => {
      if (error) this.destroy(error);

      // Push any read bytes into the local stream buffer.
      if (bytesRead) {
        this._pos += bytesRead;
        this.push(buf.slice(0, bytesRead));
        return;
      }

      // If there were no more bytes to read and the write stream is finished,
      // then this stream has reached the end.
      if (
        (
          this._writeStream as any as {
            _writableState: { finished: boolean };
          }
        )._writableState.finished
      ) {
        // Check if we have consumed the whole file up to where
        // the write stream has written before ending the stream
        if (this._pos < (this._writeStream as any as { _pos: number })._pos)
          this._read(n);
        else this.push(null);
        return;
      }

      // Otherwise, wait for the write stream to add more data or finish.
      const retry = (): void => {
        this._writeStream.off("finish", retry);
        this._writeStream.off("write", retry);
        this._read(n);
      };

      this._writeStream.on("finish", retry);
      this._writeStream.on("write", retry);
    });
  }
}

export interface WriteStreamOptions {
  highWaterMark?: WritableOptions["highWaterMark"];
  defaultEncoding?: WritableOptions["defaultEncoding"];
  tmpdir?: () => string;
}

export class WriteStream extends Writable {
  private _fd: null | number = null;
  private _path: null | string = null;
  private _pos: number = 0;
  private _readStreams: Set<ReadStream> = new Set();
  private _released: boolean = false;

  constructor(options?: WriteStreamOptions) {
    super({
      highWaterMark: options?.highWaterMark,
      defaultEncoding: options?.defaultEncoding,
      autoDestroy: false,
    });

    // Generate a random filename.
    randomBytes(16, (error, buffer) => {
      if (error) {
        this.destroy(error);
        return;
      }

      this._path = join(
        (options?.tmpdir ?? tmpdir)(),
        `capacitor-${buffer.toString("hex")}.tmp`
      );

      // Create a file in the OS's temporary files directory.
      open(this._path, "wx+", 0o600, (error, fd) => {
        if (error) {
          this.destroy(error);
          return;
        }

        // Cleanup when the process exits or is killed.
        processExitProxy.once("exit", this._cleanupSync);

        this._fd = fd;
        this.emit("ready");
      });
    });
  }

  _cleanup = (callback: (error: null | Error) => void): void => {
    const fd = this._fd;
    const path = this._path;

    if (typeof fd !== "number" || typeof path !== "string") {
      callback(null);
      return;
    }

    // Close the file descriptor.
    close(fd, (closeError) => {
      // An error here probably means the fd was already closed, but we can
      // still try to unlink the file.
      unlink(path, (unlinkError) => {
        // If we are unable to unlink the file, the operating system will
        // clean up on next restart, since we use store thes in `os.tmpdir()`
        this._fd = null;

        // We avoid removing this until now in case an exit occurs while
        // asyncronously cleaning up.
        processExitProxy.off("exit", this._cleanupSync);
        callback(unlinkError ?? closeError);
      });
    });
  };

  _cleanupSync = (): void => {
    processExitProxy.off("exit", this._cleanupSync);

    if (typeof this._fd === "number")
      try {
        closeSync(this._fd);
      } catch (error) {
        // An error here probably means the fd was already closed, but we can
        // still try to unlink the file.
      }

    try {
      if (this._path !== null) {
        unlinkSync(this._path);
      }
    } catch (error) {
      // If we are unable to unlink the file, the operating system will clean
      // up on next restart, since we use store thes in `os.tmpdir()`
    }
  };

  _final(callback: (error?: null | Error) => any): void {
    if (typeof this._fd !== "number") {
      this.once("ready", () => this._final(callback));
      return;
    }
    callback();
  }

  _write(
    chunk: Buffer,
    encoding: string,
    callback: (error?: null | Error) => any
  ): void {
    if (typeof this._fd !== "number") {
      this.once("ready", () => this._write(chunk, encoding, callback));
      return;
    }

    write(this._fd, chunk, 0, chunk.length, this._pos, (error) => {
      if (error) {
        callback(error);
        return;
      }

      // It's safe to increment `this._pos` after flushing to the filesystem
      // because node streams ensure that only one `_write()` is active at a
      // time. If this assumption is broken, the behavior of this library is
      // undefined, regardless of where this is incremented. Relocating this
      // to increment syncronously would result in correct file contents, but
      // the out-of-order writes would still open the potential for read streams
      // to scan positions that have not yet been written.
      this._pos += chunk.length;
      this.emit("write");
      callback();
    });
  }

  release(): void {
    this._released = true;
    if (this._readStreams.size === 0) this.destroy();
  }

  _destroy(
    error: undefined | null | Error,
    callback: (error?: null | Error) => any
  ): void {
    // Destroy all attached read streams.
    for (const readStream of this._readStreams) {
      readStream.destroy(error || undefined);
    }

    // This capacitor is fully initialized.
    if (typeof this._fd === "number" && typeof this._path === "string") {
      this._cleanup((cleanupError) => callback(cleanupError ?? error));
      return;
    }

    // This capacitor has not yet finished initialization; if initialization
    // does complete, immediately clean up after.
    this.once("ready", () => {
      this._cleanup((cleanupError) => {
        if (cleanupError) {
          this.emit("error", cleanupError);
        }
      });
    });

    callback(error);
  }

  createReadStream(options?: ReadStreamOptions): ReadStream {
    if (this.destroyed)
      throw new ReadAfterDestroyedError(
        "A ReadStream cannot be created from a destroyed WriteStream."
      );

    if (this._released)
      throw new ReadAfterReleasedError(
        "A ReadStream cannot be created from a released WriteStream."
      );

    const readStream = new ReadStream(this, options);
    this._readStreams.add(readStream);

    readStream.once("close", (): void => {
      this._readStreams.delete(readStream);

      if (this._released && this._readStreams.size === 0) {
        this.destroy();
      }
    });

    return readStream;
  }
}

export default {
  WriteStream,
  ReadStream,
  ReadAfterDestroyedError,
  ReadAfterReleasedError,
};
