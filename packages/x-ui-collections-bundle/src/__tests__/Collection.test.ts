import { Collection } from "..";
import { container } from "./ecosystem";
import {
  CollectionTransformMap,
  CollectionLinkConfig,
} from "../graphql/Collection";
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
    class AppFileGroupsCollection extends Collection<unknown> {
      getName() {
        return "AppFileGroups";
      }
    }

    class TestCollection extends Collection<Record<string, unknown>> {
      getName() {
        return "test";
      }

      // Return here how you want to transform certain fields
      getTransformMap(): CollectionTransformMap<Record<string, unknown>> {
        return {
          createdAt: (v) => new Date(v),
          updatedAt: (v) => new Date(v),
        };
      }

      getLinks(): CollectionLinkConfig<Record<string, unknown>>[] {
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
    let filtered: unknown[] = data.map((d) =>
      d.attachments?.files?.map((f) => f.thumbs)
    );
    filtered = filtered.flat(5);

    expect(filtered[0] == filtered[1]).toBe(false);
    expect(filtered).toHaveLength(3);
  });
});
