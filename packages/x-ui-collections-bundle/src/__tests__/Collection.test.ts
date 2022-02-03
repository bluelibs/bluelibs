import { Collection } from "..";
import { container } from "./ecosystem";
import { CollectionTransformMap } from "../graphql/Collection";
import { EJSON } from "@bluelibs/ejson";
import { richResponse, richResponseBody } from "./samples/richResponse";
import { cleanTypename } from "../graphql/utils/cleanTypename";

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

  test("Transform", async () => {
    class AppFileGroupsCollection extends Collection<any> {
      getName() {
        return "AppFileGroups";
      }
    }

    class TestCollection extends Collection<any> {
      getName() {
        return "test";
      }

      // Return here how you want to transform certain fields
      getTransformMap(): CollectionTransformMap<any> {
        return {
          createdAt: (v) => new Date(v),
          updatedAt: (v) => new Date(v),
        };
      }

      getLinks() {
        return [
          {
            collection: () => AppFileGroupsCollection,
            name: "attachments",
            field: "attachmentsId",
          },
        ];
      }
    }

    const testCollection = container.get(TestCollection);

    const data = EJSON.clone(richResponse);

    cleanTypename(data, richResponseBody);
    testCollection.transform(data);
    let filtered: any[] = data.map((d) =>
      d.attachments?.files?.map((f) => f.thumbs)
    );
    filtered = filtered.flat(5);

    expect(filtered[0] == filtered[1]).toBe(false);
    expect(filtered).toHaveLength(3);
  });
});
