import { ContainerInstance, Inject, Service } from "@bluelibs/core";
import { getLinker, LINK_STORAGE } from "@bluelibs/nova";
import { Collection } from "../models/Collection";

export type LinkInfo = {
  from: Collection;
  to: Collection;
  name: string;
};

export type LinkElements = {
  fromId: any;
  toId: any;
};

/**
 * Variants:
 *  link one direct: id, non-id
 *  link one inversed: id, non-id
 *  link one inversed-unique: id, non-id
 *  link many direct: id, non-id
 *  link many inversed: id, non-id
 */
@Service()
export class DeepSyncService {
  @Inject(() => ContainerInstance)
  protected readonly container: ContainerInstance;

  // Insert Many?
  // Update Many?
  async insertOne(collection: Collection, _object) {
    const object = Object.assign({}, _object);

    // line-level insert.
    const links = collection.getStaticVariable("links");

    // Process links (direct) that don't need current id, but this insertion needs their id
    for (const linkName in links) {
      const linkInfo = links[linkName];
      if (object[linkName] && linkInfo.field) {
        // TODO: computed collections pls.
        const relatedCollection: Collection = this.container.get(
          linkInfo.collection(this.container)
        );

        if (linkInfo.many) {
          const relatedObjectsToInsert = object[linkName].filter(
            (obj) => !Boolean(obj._id)
          );
          for (const relatedObject of relatedObjectsToInsert) {
            const result = await relatedCollection.insertOne(relatedObject);
            relatedObject._id = result.insertedId;
          }

          object[linkInfo.field] = object[linkName].map((obj) => obj._id);
        } else {
          if (object[linkName]._id) {
            object[linkInfo.field] = object[linkName]._id;
          } else {
            const result = await relatedCollection.insertOne(object[linkName]);
            object[linkName]._id = result.insertedId;
            object[linkInfo.field] = result.insertedId;
          }
        }

        delete object[linkName];
      }
    }

    const result = await collection.collection.insertOne(object);
    object._id = result.insertedId;

    // Processing the inversed links where the `objectId` is needed.
    for (const linkName in links) {
      const linkInfo = links[linkName];
      if (object[linkName] && !linkInfo.field) {
        const relatedCollection: Collection = this.container.get(
          linkInfo.collection(this.container)
        );
        const relatedLinks = relatedCollection.getStaticVariable("links");
        const inversedLinkInfo = relatedLinks[linkInfo.inversedBy];

        const subobjects = Array.isArray(object[linkName])
          ? object[linkName]
          : [object.linkName];

        for (const subobject of subobjects) {
          if (!subobject._id) {
            subobject[inversedLinkInfo.field] = inversedLinkInfo.many
              ? [object._id]
              : object.id;
            const result = await relatedCollection.insertOne(subobject);
            subobject._id = result.insertedId;
          } else {
            await relatedCollection.updateOne(
              { _id: subobject._id },
              {
                $set: {
                  [inversedLinkInfo.field]: inversedLinkInfo.many
                    ? [object._id]
                    : object.id,
                },
              }
            );
          }
        }
      }
    }
  }

  async updateOne(collection: Collection, filter, modifier) {
    // only works with single ones, by _id
    const objectId = filter._id;

    // we look into modifier.$set, $addToSet, and $pull

    const links = collection.getStaticVariable("links");

    if (modifier.$set) {
      const $setKeys = Object.keys(modifier.$set);
      for (const linkName in links) {
        const linkInfo = links[linkName];
        // TODO: check eligibility, $set will not work with many links.

        const $linkSetStarter = linkName + ".";
        const $linkSetKeys = $setKeys.filter(
          (key) => key.indexOf($linkSetStarter) > -1
        );
        const object: any = {};
        $linkSetKeys.forEach(($linkSetKey) => {
          Object.assign(object, {
            [$linkSetKey.slice($linkSetStarter.length)]: modifier[$linkSetKey],
          });

          delete modifier[$linkSetKey];
        });
        if (modifier[linkName]) {
          Object.assign(object, modifier[linkName]);
          delete modifier[linkName];
        }
        if (Object.keys(object).length > 0) {
          // perform the update
          // if the object not exists, update it?
          const relatedCollection: Collection = this.container.get(
            linkInfo.collection(this.container)
          );

          let relatedObjectId = object._id;
          if (!relatedObjectId) {
            const result = await collection.queryOne({
              $: {
                filters: {
                  _id: objectId,
                },
              },
              [linkName]: {
                _id: 1,
              },
            });
            if (!result) {
              throw new Error("We could not find the object to update.");
            }
            relatedObjectId = result[linkName]._id;
          }

          if (relatedObjectId) {
            relatedCollection.updateOne(
              { _id: relatedObjectId },
              {
                $set: object,
              }
            );
          } else {
            // We need to insert this link properly
            if (linkInfo.inversedBy) {
              const relatedLinks = relatedCollection.getStaticVariable("links");
              const inversedLinkInfo = relatedLinks[linkInfo.inversedBy];
              Object.assign(object, {
                [inversedLinkInfo.field]: objectId,
              });
            }
            relatedCollection.insertOne(object);
            if (!linkInfo.inversedBy) {
              modifier.$set[linkInfo.field] = objectId;
            }
          }
        }
      }
    }

    if (modifier.$addToSet) {
      for (const linkName in links) {
        const linkInfo = links[linkName];
        if (modifier.$addToSet[linkName]) {
          let value = modifier.$addToSet[linkName];
          if (!Array.isArray(value)) {
            value = [value];
          }
          const relatedCollection: Collection = this.container.get(
            linkInfo.collection(this.container)
          );

          if (linkInfo.field) {
            for (const _value of value) {
              if (!_value._id) {
                const result = await relatedCollection.insertOne(_value);
                _value._id = result.insertedId;
              }
            }
            // Direct link.

            modifier.$addToSet[linkName] = value.map((v) => v._id);
          } else {
            // INVERSED LINK, STORAGE ON THE OTHER SIDE
            const relatedLinks = relatedCollection.getStaticVariable("links");
            const inversedLinkInfo = relatedLinks[linkInfo.inversedBy];
            for (const _value of value) {
              if (!_value._id) {
                const result = await relatedCollection.insertOne({
                  _value,
                });
                _value._id = result.insertedId;
              }
            }
          }

          delete modifier.$addToSet[linkName];
        }
      }
    }

    collection.collection.updateOne(filter, modifier);
  }
}

// TODO:
// - Cascading Logic
// collection.link("user", id | object | etc);
