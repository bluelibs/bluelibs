import { Readable, ReadableOptions, Writable, WritableOptions } from "stream";
export declare class ReadAfterDestroyedError extends Error {}
export declare class ReadAfterReleasedError extends Error {}
export interface ReadStreamOptions {
  highWaterMark?: ReadableOptions["highWaterMark"];
  encoding?: ReadableOptions["encoding"];
}
export declare class ReadStream extends Readable {
  private _pos;
  private _writeStream;
  constructor(writeStream: WriteStream, options?: ReadStreamOptions);
  _read(n: number): void;
}
export interface WriteStreamOptions {
  highWaterMark?: WritableOptions["highWaterMark"];
  defaultEncoding?: WritableOptions["defaultEncoding"];
  tmpdir?: () => string;
}
export declare class WriteStream extends Writable {
  private _fd;
  private _path;
  private _pos;
  private _readStreams;
  private _released;
  constructor(options?: WriteStreamOptions);
  _cleanup: (callback: (error: null | Error) => void) => void;
  _cleanupSync: () => void;
  _final(callback: (error?: null | Error) => any): void;
  _write(
    chunk: Buffer,
    encoding: string,
    callback: (error?: null | Error) => any
  ): void;
  release(): void;
  _destroy(
    error: undefined | null | Error,
    callback: (error?: null | Error) => any
  ): void;
  createReadStream(options?: ReadStreamOptions): ReadStream;
}
declare const _default: {
  WriteStream: typeof WriteStream;
  ReadStream: typeof ReadStream;
  ReadAfterDestroyedError: typeof ReadAfterDestroyedError;
  ReadAfterReleasedError: typeof ReadAfterReleasedError;
};
// export default _default;
