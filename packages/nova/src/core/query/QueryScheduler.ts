interface PendingRequest {
  start(): void;
  reject(reason: unknown): void;
  next?: PendingRequest;
}

/** Limits database requests, never the traversal waiting for their descendants. */
export default class QueryScheduler {
  private active = 0;
  private first?: PendingRequest;
  private last?: PendingRequest;
  private failed = false;
  private failure: unknown;

  constructor(private readonly maxCap: number) {
    if (!Number.isSafeInteger(maxCap) || maxCap < 1) {
      throw new Error("Query maxCap must be a positive safe integer.");
    }
  }

  public run<T>(operation: () => Promise<T>): Promise<T> {
    if (this.failed) {
      return Promise.reject(this.failure);
    }

    return new Promise<T>((resolve, reject) => {
      const request: PendingRequest = {
        start: () => {
          void this.execute(operation, resolve, reject);
        },
        reject,
      };

      if (this.active < this.maxCap) {
        request.start();
      } else {
        // A linked FIFO avoids shifting the entire queue on each completion.
        if (this.last) {
          this.last.next = request;
        } else {
          this.first = request;
        }
        this.last = request;
      }
    });
  }

  private async execute<T>(
    operation: () => Promise<T>,
    resolve: (value: T) => void,
    reject: (reason: unknown) => void
  ) {
    this.active++;
    try {
      resolve(await operation());
    } catch (error) {
      this.fail(error);
      reject(error);
    } finally {
      this.active--;
      const next = this.takeNext();
      if (next) {
        next.start();
      }
    }
  }

  private takeNext(): PendingRequest | undefined {
    const request = this.first;
    if (request) {
      this.first = request.next;
      request.next = undefined;
      if (!this.first) {
        this.last = undefined;
      }
    }
    return request;
  }

  private fail(error: unknown) {
    if (this.failed) {
      return;
    }
    this.failed = true;
    this.failure = error;

    let request: PendingRequest;
    while ((request = this.takeNext())) {
      request.reject(error);
    }
  }
}
