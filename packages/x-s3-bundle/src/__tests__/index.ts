import { kernel, container } from "./ecosystem";
import { S3UploadService } from "../services/S3UploadService";

beforeAll(async () => {
  try {
    await kernel.init();
  } catch (e) {
    console.log(e);
  }
});

afterAll(async () => {
  await kernel.shutdown();
});

test("URL should work", () => {
  const uploadService = container.get(S3UploadService);
  expect(uploadService.getUrl("2018/abc.pdf")).toBe(
    "https://s3.amazonaws.com/test.com/2018/abc.pdf"
  );
  expect(uploadService.getUrl("/2018/abc.pdf")).toBe(
    "https://s3.amazonaws.com/test.com/2018/abc.pdf"
  );
});
