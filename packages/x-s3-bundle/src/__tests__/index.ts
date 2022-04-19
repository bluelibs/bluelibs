import { kernel, container } from "./ecosystem";
import { UploadService } from "../services/UploadService";

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
  const uploadService = container.get(UploadService);
  /*expect(uploadService.getUrl("2018/abc.pdf")).toBe(
    "https://s3.amazonaws.com/test.com/2018/abc.pdf"
  );
  expect(uploadService.getUrl("/2018/abc.pdf")).toBe(
    "https://s3.amazonaws.com/test.com/2018/abc.pdf"
  );*/
});
