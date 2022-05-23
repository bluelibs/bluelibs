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

test("URL should work", async () => {
  const uploadService = container.get(UploadService);
  expect(uploadService.getUrl("2018/abc.pdf")).toBe(
    "https://s3.amazonaws.com/test.com/2018/abc.pdf"
  );
  expect(uploadService.getUrl("/2018/abc.pdf")).toBe(
    "https://s3.amazonaws.com/test.com/2018/abc.pdf"
  );
});

test("db file upload should work", async () => {
  const uploadService = container.get(UploadService);
  const appFile = await uploadService.doUpload(
    "whatever.pdf",
    "application/pdf",
    Buffer.from("coucou"),
    undefined,
    "dbstorage"
  );
  expect(appFile).toBeDefined();
  expect(await uploadService.getFileURL(appFile._id, "dbstorage")).toEqual(
    "http://localhost:4000/download-db-file/" + appFile.path
  );
});

test("local file upload should work", async () => {
  const uploadService = container.get(UploadService);
  const appFile = await uploadService.doUpload(
    "whatever.pdf",
    "application/pdf",
    Buffer.from("coucou"),
    undefined,
    "localstorage"
  );
  expect(appFile).toBeDefined();
  expect(await uploadService.getFileURL(appFile._id, "localstorage")).toEqual(
    "http://localhost:4000/download-local-file/" + appFile.path
  );
});
