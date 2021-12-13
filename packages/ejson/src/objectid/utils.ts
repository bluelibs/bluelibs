export function isUint8Array(value: unknown): value is Uint8Array {
  return Object.prototype.toString.call(value) === "[object Uint8Array]";
}

type RandomBytesFunction = (size: number) => Uint8Array;

export const randomBytes: RandomBytesFunction = function insecureRandomBytes(
  size: number
) {
  const result = Buffer.alloc(size);
  for (let i = 0; i < size; ++i) result[i] = Math.floor(Math.random() * 256);

  return result;
};
