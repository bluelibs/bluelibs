// @ts-check

export default function isExtractableFile(value) {
  return (
    (typeof File !== "undefined" && value instanceof File) ||
    (typeof Blob !== "undefined" && value instanceof Blob)
  );
}

/**
 * An extractable file.
 * @typedef {import(
 *   "extract-files/isExtractableFile.mjs"
 * ).ExtractableFile} ExtractableFile
 */
