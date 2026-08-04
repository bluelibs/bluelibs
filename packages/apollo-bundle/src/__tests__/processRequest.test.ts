import processRequest from "../graphql-upload/processRequest";
import { Readable } from "stream";

/**
 * Security-focused tests for the vendored graphql-upload processRequest.
 * This code path parses untrusted multipart/form-data bodies, so the size and
 * count limits are the security boundary worth locking down.
 *
 * The vendored module is compiled with `// @ts-nocheck`, so the resolved
 * operations are typed here with a single boundary assertion rather than
 * spreading `any` through the assertions.
 */

type FileUpload = {
  filename: string;
  mimetype: string;
  encoding?: string;
  createReadStream: (options?: unknown) => NodeJS.ReadableStream;
};

type ParsedOperations = {
  query: string;
  variables: Record<string, { promise: Promise<FileUpload> }>;
};

type FilePart = { filename: string; contentType: string; content: string };

function buildMultipart({
  operations,
  map,
  files,
  boundary = "TESTBOUNDARY123",
}: {
  operations: Record<string, unknown>;
  map: Record<string, string[]>;
  files?: Record<string, FilePart>;
  boundary?: string;
}) {
  const chunks: string[] = [];

  chunks.push(`--${boundary}\r\n`);
  chunks.push(`Content-Disposition: form-data; name="operations"\r\n\r\n`);
  chunks.push(`${JSON.stringify(operations)}\r\n`);

  chunks.push(`--${boundary}\r\n`);
  chunks.push(`Content-Disposition: form-data; name="map"\r\n\r\n`);
  chunks.push(`${JSON.stringify(map)}\r\n`);

  if (files) {
    for (const [key, file] of Object.entries(files)) {
      chunks.push(`--${boundary}\r\n`);
      chunks.push(
        `Content-Disposition: form-data; name="${key}"; filename="${file.filename}"\r\n`
      );
      chunks.push(`Content-Type: ${file.contentType}\r\n\r\n`);
      chunks.push(file.content);
      chunks.push("\r\n");
    }
  }

  chunks.push(`--${boundary}--\r\n`);

  const body = Buffer.from(chunks.join(""));

  const request = new Readable();
  (request as { headers?: Record<string, string> }).headers = {
    "content-type": `multipart/form-data; boundary=${boundary}`,
  };
  request.push(body);
  request.push(null);

  const response = { once: () => {} };

  return { request, response };
}

async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  let out = "";
  for await (const chunk of stream) {
    out += chunk.toString();
  }
  return out;
}

const UPLOAD_OPERATION = {
  query: "mutation($f: Upload!) { upload(file: $f) }",
  variables: { f: null },
};

function asParsed(value: unknown): ParsedOperations {
  return value as ParsedOperations;
}

describe("processRequest (vendored graphql-upload)", () => {
  it("parses a multipart body and exposes the file as an upload", async () => {
    const { request, response } = buildMultipart({
      operations: UPLOAD_OPERATION,
      map: { "0": ["variables.f"] },
      files: {
        "0": {
          filename: "a.txt",
          contentType: "text/plain",
          content: "hello world",
        },
      },
    });

    const parsed = asParsed(await processRequest(request, response));

    expect(parsed.query).toBe(UPLOAD_OPERATION.query);
    const file = await parsed.variables.f.promise;
    expect(file.filename).toBe("a.txt");
    expect(file.mimetype).toBe("text/plain");
    expect(await streamToString(file.createReadStream())).toBe("hello world");
  });

  it("refuses to read a file that exceeds maxFileSize", async () => {
    const { request, response } = buildMultipart({
      operations: UPLOAD_OPERATION,
      map: { "0": ["variables.f"] },
      files: {
        "0": {
          filename: "big.txt",
          contentType: "text/plain",
          content: "x".repeat(1000),
        },
      },
    });

    const parsed = asParsed(
      await processRequest(request, response, { maxFileSize: 10 })
    );

    // The upload still resolves with metadata, but reading it throws the
    // truncation error — the oversized file is never delivered.
    const file = await parsed.variables.f.promise;
    expect(() => file.createReadStream()).toThrow(
      /exceeds the 10 byte size limit/i
    );
  });

  it("rejects a multipart field that exceeds maxFieldSize", async () => {
    const hugeOperations = {
      query: "mutation($f: Upload!) { upload(file: $f) }",
      variables: { f: null, pad: "x".repeat(5000) },
    };
    const { request, response } = buildMultipart({
      operations: hugeOperations,
      map: { "0": ["variables.f"] },
    });

    await expect(
      processRequest(request, response, { maxFieldSize: 100 })
    ).rejects.toThrow(/exceeds the 100 byte size limit/i);
  });

  it("rejects the request when maxFiles is exceeded", async () => {
    const { request, response } = buildMultipart({
      operations: UPLOAD_OPERATION,
      map: { "0": ["variables.f"], "1": ["variables.g"] },
      files: {
        "0": { filename: "one.txt", contentType: "text/plain", content: "one" },
        "1": { filename: "two.txt", contentType: "text/plain", content: "two" },
      },
    });

    await expect(
      processRequest(request, response, { maxFiles: 1 })
    ).rejects.toThrow(/max file uploads exceeded/i);
  });
});
