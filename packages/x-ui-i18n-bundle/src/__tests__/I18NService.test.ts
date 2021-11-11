import { I18NService } from "..";
import { container } from "./ecosystem";

describe("UII18NBundle", () => {
  test("Container Injection", async () => {
    const i18nService = container.get(I18NService);

    expect(i18nService).toBeTruthy();
  });
});
