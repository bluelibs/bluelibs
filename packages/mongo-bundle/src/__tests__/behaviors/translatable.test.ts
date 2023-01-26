// write tests for the translatable behavior
//
import { getEcosystem } from "../helpers";
import { Collection } from "../../models/Collection";
import timestampable from "../../behaviors/timestampable";
import translatable from "../../behaviors/translatable";

describe("Translatable", () => {
  it("Should work with translatable behaviors, context", async () => {
    const { container } = await getEcosystem();

    class Posts extends Collection<any> {
      static behaviors = [
        translatable({
          fields: ["title", "description"],
          locales: ["en", "fr"],
          defaultLocale: "en",
        }),
      ];

      static collectionName = "translatable_test";
    }

    const postsCollection = container.get(Posts);
    await postsCollection.deleteMany({});
    let resultInsert = await postsCollection.insertOne(
      {
        title: "Bonjour",
      },
      {
        context: {
          locale: "fr",
        },
      }
    );

    let post = await postsCollection.findOne(resultInsert.insertedId);

    expect(post.title).toBeUndefined();
    expect(post.title_i18n).toHaveLength(1);
    expect(post.title_i18n[0].locale).toBe("fr");
    expect(post.title_i18n[0].value).toBe("Bonjour");
  });

  it("Should work updating the i18n field", async () => {
    const { container } = await getEcosystem();

    class Posts extends Collection<any> {
      static behaviors = [
        translatable({
          fields: ["title", "description"],
          locales: ["en", "fr"],
          defaultLocale: "en",
        }),
      ];

      static collectionName = "translatable_test2";
    }

    const postsCollection = container.get(Posts);
    await postsCollection.deleteMany({});

    let resultInsert = await postsCollection.insertOne(
      {
        title: "Bonjour",
      },
      {
        context: {
          locale: "fr",
        },
      }
    );

    let post = await postsCollection.findOne(resultInsert.insertedId);

    await postsCollection.updateOne(
      { _id: post._id },
      {
        $set: {
          title: "Hello",
        },
      },
      {
        context: {
          locale: "en",
        },
      }
    );

    post = await postsCollection.findOne(resultInsert.insertedId);
    expect(post.title_i18n).toHaveLength(2);

    post = await postsCollection.queryOne({
      $: {
        filters: {
          _id: post._id,
        },
      },
      _id: 1,
      title: 1,
    });

    post = await postsCollection.queryOne(
      {
        $: {
          filters: {
            _id: post._id,
          },
        },
        _id: 1,
        title: 1,
      },
      null,
      {
        locale: "fr",
      }
    );

    expect(post.title).toBe("Bonjour");

    await postsCollection.updateOne(
      { _id: post._id },
      {
        $set: {
          title: "Hello2",
        },
      },
      {
        context: {
          locale: "en",
        },
      }
    );

    post = await postsCollection.queryOne(
      {
        $: {
          filters: {
            _id: post._id,
          },
        },
        _id: 1,
        title: 1,
        title_i18n: 1,
      },
      null,
      {
        locale: "en",
      }
    );

    expect(post.title).toBe("Hello2");
    expect(post.title_i18n).toHaveLength(2);
  });
});
