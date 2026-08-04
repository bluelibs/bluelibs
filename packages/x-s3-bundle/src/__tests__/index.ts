import { Kernel, ContainerInstance } from "@bluelibs/core";
import { S3UploadService } from "..";
import { createKernel } from "./ecosystem";

let kernel: Kernel;
beforeAll(async () => {
  kernel = createKernel();

  try {
    await kernel.init();
  } catch (e) {
    console.error(e);
    throw e;
  }
});

afterAll(async () => {
  try {
    // await kernel.shutdown();
  } catch (e) {
    console.error(e);
    throw e;
  }
});

test("boots the S3 bundle and resolves the upload service", () => {
  const container: ContainerInstance = kernel.container;

  // Resolving the service proves the bundle booted and wired the S3 client.
  const uploadService = container.get(S3UploadService);
  expect(uploadService).toBeDefined();

  // getUrl is a pure URL builder (no AWS round-trips); leading slashes on the
  // key are normalised away, so both forms produce the same URL.
  expect(uploadService.getUrl("/2018/abc.pdf")).toBe(
    uploadService.getUrl("2018/abc.pdf")
  );
  expect(uploadService.getUrl("2018/abc.pdf")).toContain(
    "https://s3.amazonaws.com/test.com"
  );
});
