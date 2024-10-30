/** @public */
export interface ObjectIdLike {
  id: string | Uint8Array;
  __id?: string;
  toHexString(): string;
}

/**
 * A lightweight class that implements the ObjectIdLike interface.
 * @public
 */
export class ObjectId implements ObjectIdLike {
  id: Uint8Array;
  __id?: string;
  public _bsontype: "ObjectId" = "ObjectId";

  /**
   * Create a new LightObjectId
   * @param id - A 24 character hex string or a 12-byte Uint8Array
   */
  constructor(id?: string | Uint8Array) {
    this[Symbol.for("@@mdb.bson.version")] = 6;
    if (id === undefined) {
      // Generate a new id if none provided
      this.id = ObjectId.generate();
    } else if (typeof id === "string") {
      if (id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new Error("String should be a 24 character hex string");
      }
      this.id = new Uint8Array(12);
      for (let i = 0; i < 12; i++) {
        this.id[i] = parseInt(id.slice(i * 2, i * 2 + 2), 16);
      }
    } else if (id instanceof Uint8Array && id.length === 12) {
      this.id = id;
    } else {
      throw new Error(
        "id must be a 24 character hex string or a 12-byte Uint8Array"
      );
    }

    // Cache the hex string if the input was a Uint8Array
    if (this.id instanceof Uint8Array) {
      this.__id = this.toHexString();
    }
  }

  /**
   * Convert the id to a 24 character hex string
   */
  toHexString(): string {
    if (typeof this.id === "string") {
      return this.id;
    }
    if (this.__id) {
      return this.__id;
    }
    this.__id = Array.from(this.id, (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");
    return this.__id;
  }

  /**
   * Generate a new 12-byte id
   */
  public static generate(): Uint8Array {
    const buffer = new Uint8Array(12);
    const now = new Date();

    // 4-byte timestamp
    const timestamp = Math.floor(now.getTime() / 1000);
    buffer[0] = (timestamp >> 24) & 0xff;
    buffer[1] = (timestamp >> 16) & 0xff;
    buffer[2] = (timestamp >> 8) & 0xff;
    buffer[3] = timestamp & 0xff;

    // 5-byte random value
    for (let i = 4; i < 9; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }

    // 3-byte incrementing counter
    ObjectId.counter = (ObjectId.counter + 1) % 0xffffff;
    buffer[9] = (ObjectId.counter >> 16) & 0xff;
    buffer[10] = (ObjectId.counter >> 8) & 0xff;
    buffer[11] = ObjectId.counter & 0xff;

    return buffer;
  }

  /**
   * Check if the provided value is a valid ObjectIdLike
   */
  static isValid(value: any): boolean {
    if (!value) return false;
    if (value instanceof ObjectId) return true;
    if (typeof value === "string")
      return value.length === 24 && /^[0-9a-fA-F]{24}$/.test(value);
    if (value instanceof Uint8Array) return value.length === 12;
    if (typeof value === "object" && typeof value.toHexString === "function") {
      const hex = value.toHexString();
      return (
        typeof hex === "string" &&
        hex.length === 24 &&
        /^[0-9a-fA-F]{24}$/.test(hex)
      );
    }
    return false;
  }

  /**
   * Convert the ObjectIdLike to a string
   */
  toString(): string {
    return this.toHexString();
  }

  /**
   * Compare this ObjectIdLike with another
   */
  equals(otherId: string | ObjectIdLike): boolean {
    if (typeof otherId === "string") {
      return this.toHexString() === otherId.toLowerCase();
    }
    if (otherId && typeof otherId.toHexString === "function") {
      return this.toHexString() === otherId.toHexString().toLowerCase();
    }
    return false;
  }

  /** @internal */
  serializeInto?(uint8array: Uint8Array, index: number): 12 {
    uint8array[index] = this.id[0];
    uint8array[index + 1] = this.id[1];
    uint8array[index + 2] = this.id[2];
    uint8array[index + 3] = this.id[3];
    uint8array[index + 4] = this.id[4];
    uint8array[index + 5] = this.id[5];
    uint8array[index + 6] = this.id[6];
    uint8array[index + 7] = this.id[7];
    uint8array[index + 8] = this.id[8];
    uint8array[index + 9] = this.id[9];
    uint8array[index + 10] = this.id[10];
    uint8array[index + 11] = this.id[11];
    return 12;
  }

  inspect(): string {
    return `ObjectId("${this.toHexString()}")`;
  }

  getTimestamp(): Date {
    const timestamp = new Uint8Array(4);
    timestamp[0] = this.id[0];
    timestamp[1] = this.id[1];
    timestamp[2] = this.id[2];
    timestamp[3] = this.id[3];
    const timestampInt = new DataView(timestamp.buffer).getUint32(0);
    return new Date(timestampInt * 1000);
  }

  toJSON(): string {
    return this.toHexString();
  }

  private static counter = Math.floor(Math.random() * 0xffffff);
}
