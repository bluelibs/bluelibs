import { Kernel } from "@bluelibs/core";
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

test("URL should work", () => {
  // const uploadService = container.get(S3UploadService);
  // expect(uploadService.getUrl("2018/abc.pdf")).toBe(
  //   "https://s3.amazonaws.com/test.com/2018/abc.pdf"
  // );
  // expect(uploadService.getUrl("/2018/abc.pdf")).toBe(
  //   "https://s3.amazonaws.com/test.com/2018/abc.pdf"
  // );
});
