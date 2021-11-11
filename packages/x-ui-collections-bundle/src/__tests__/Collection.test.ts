import { Collection } from "..";
import { container } from "./ecosystem";

describe("XUICollectionsBundle", () => {
  test("Container Injection", async () => {
    class TestCollection extends Collection<{ a: string }> {
      getName() {
        return "test";
      }
    }

    const testCollection = container.get(TestCollection);

    expect(testCollection.getName()).toBe("test");
  });
});
