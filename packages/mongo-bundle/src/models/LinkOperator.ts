import { DeepPartial, Service } from "@bluelibs/core";
import { ObjectId } from "@bluelibs/ejson";
import { Collection, MONGO_BUNDLE_COLLECTION } from "./Collection";
import { Linker, LINK_STORAGE } from "@bluelibs/nova";
import * as MongoDB from "mongodb";

/**
 * This represents ObjectId from @bluelibs/ejson or from "mongodb";
 */
export type ID = ObjectId | MongoDB.ObjectId;

export type DocumentWithID = { _id?: ID };

type GenericObject = {
  [key: string]: any;
};

type Linkable<T extends DocumentWithID = null> =
  | ID
  | (T extends null ? GenericObject : DeepPartial<T>);

type CleanOptionsType = {
  /**
   * Delete the objects from the database as well.
   */
  delete?: boolean;
};

type LinkOptionsType = {
  /**
   * Only makes sense for relationships which are of type "many" and "direct".
   */
  override?: boolean;
  /**
   * This applies to direct relationships, if true, the elements removed will be deleted from database.
   */
  deleteOrphans?: boolean;
};

type UnlinkOptionsType = {
  /**
   * Deletes the unlinked objects
   */
  delete?: boolean;
};

export type Unpacked<T> = T extends (infer U)[] ? U : T;

/**
 * This class allows you to properly play with relationships
 */
export class LinkOperatorModel<T extends DocumentWithID = null> {
  protected relatedCollection: Collection<any>;
  protected linker: Linker;

  constructor(
    protected readonly collection: Collection<any>,
    protected readonly linkName: string
  ) {
    this.linker = collection.collection[LINK_STORAGE][linkName] as Linker;
    if (!this.linker) {
      throw new Error(
        `There's no link named: "${linkName}" inside "${collection.collectionName}"`
      );
    }
    this.relatedCollection =
      this.linker.getLinkedCollection()[MONGO_BUNDLE_COLLECTION];
  }

  /**
   * Use this function to clean all related links, with the ability to also delete them.
   *
   * @param rootId
   * @param options
   */
  async clean(rootId: ID, options: CleanOptionsType = {}) {
    if (this.linker.isVirtual()) {
      await this.cleanVirtualLink(rootId, options);
    } else {
      await this.cleanDirectLink(rootId, options);
    }
  }

  /**
   * Create links between collections, it will automatically persist them as well.
   *
   * @param rootId
   * @param valueIds
   * @param options
   */
  async link(
    rootId: ID,
    valueIds: Linkable<T> | Linkable<T>[],
    options: LinkOptionsType = {}
  ) {
    if (!Array.isArray(valueIds)) {
      valueIds = [valueIds];
    }

    const ids = await this.getValueIdsObjects(valueIds as Linkable<T>[]);

    if (this.linker.isVirtual()) {
      await this.linkVirtual(ids, rootId);
    } else {
      await this.linkDirect(options, rootId, ids);
    }
  }

  /**
   * Unlink collections and optionally apply a deletion
   * @param fromId
   * @param valueIds
   * @param options
   */
  async unlink(
    fromId: ID,
    valueIds: Linkable<T> | Linkable<T>[],
    options: UnlinkOptionsType = {}
  ) {
    if (!Array.isArray(valueIds)) {
      valueIds = [valueIds];
    }

    const ids = await this.getValueIdsObjects(valueIds as Linkable<T>[]);

    if (this.linker.isVirtual()) {
      await this.unlinkVirtual(fromId, ids, options);
    } else {
      await this.unlinkDirect(fromId, ids, options);
    }
  }

  protected async unlinkDirect(
    rootId: ID,
    ids: ID[],
    options: UnlinkOptionsType
  ) {
    let orphanedIds = null;
    if (options.delete) {
      await this.relatedCollection.deleteMany({
        _id: { $in: ids as MongoDB.ObjectId[] },
      });
    }

    if (this.linker.isMany()) {
      await this.collection.updateOne(
        {
          _id: rootId,
        },
        {
          // @ts-ignore
          $pull: {
            [this.linker.linkStorageField]: ids,
          },
        }
      );
    } else {
      // TODO: throw error if specific unlink info?
      await this.collection.updateOne(
        {
          _id: rootId,
        },
        {
          $set: { [this.linker.linkStorageField]: null },
        }
      );
    }
  }

  protected async unlinkVirtual(
    rootId: ID,
    ids: ID[],
    options: UnlinkOptionsType
  ) {
    if (options.delete) {
      await this.relatedCollection.deleteMany({
        _id: { $in: ids as MongoDB.ObjectId[] },
      });
    }

    if (this.linker.isMany()) {
      await this.relatedCollection.updateMany(
        {
          _id: { $in: ids as MongoDB.ObjectId[] },
        },
        {
          // @ts-ignore
          $pull: {
            [this.linker.linkStorageField]: rootId,
          },
        }
      );
    } else {
      // TODO: delete?
      await this.relatedCollection.updateMany(
        {
          _id: { $in: ids as MongoDB.ObjectId[] },
        },
        {
          $set: {
            [this.linker.linkStorageField]: null,
          },
        }
      );
    }
  }

  protected async linkDirect(options: LinkOptionsType, rootId: ID, ids: ID[]) {
    let orphanedIds = null;
    if (options.deleteOrphans) {
      orphanedIds = await this.getOrphanedIds(rootId, ids); // array of ids
    }

    if (this.linker.isMany()) {
      await this.collection.updateOne(
        {
          _id: rootId,
        },
        {
          [options.override ? "$set" : "$addToSet"]: {
            [this.linker.linkStorageField]: ids,
          },
        }
      );
    } else {
      await this.collection.updateOne(
        {
          _id: rootId,
        },
        {
          $set: { [this.linker.linkStorageField]: ids[0] },
        }
      );
      // throw if valueIds > 0, will not work
    }

    if (orphanedIds) {
      await this.relatedCollection.deleteMany({
        _id: { $in: orphanedIds },
      });
    }
  }

  protected async linkVirtual(ids: ID[], rootId: ID) {
    if (this.linker.isMany()) {
      await this.relatedCollection.updateMany(
        {
          _id: { $in: ids as MongoDB.ObjectId[] },
        },
        {
          // @ts-ignore
          $addToSet: {
            [this.linker.linkStorageField]: rootId,
          },
        }
      );
    } else {
      await this.relatedCollection.updateMany(
        {
          _id: { $in: ids as MongoDB.ObjectId[] },
        },
        {
          $set: {
            [this.linker.linkStorageField]: rootId,
          },
        }
      );
    }
  }

  private async getOrphanedIds(rootId: ID, ids: ID[]): Promise<ID[]> {
    const result = await this.collection.findOne(
      { _id: rootId },
      {
        projection: {
          [this.linker.linkStorageField]: 1,
        },
      }
    );
    const orphanedIds = ids.filter((_id) => {
      let found = false;
      for (const id of result[this.linker.linkStorageField]) {
        if (id.toString() === _id.toString()) {
          found = true;
          break;
        }
      }
      // if it's not found in the new set it's orphaned will be deleted after
      return !found;
    }); // array of ids

    return orphanedIds;
  }

  /**
   * Since objects can be ids or objects, we can transform non-persisted objects into persisted ones and link them properly
   * @param linkables
   * @returns
   */
  protected async getValueIdsObjects(
    linkables: Linkable<T>[]
  ): Promise<Array<ID>> {
    const result: Array<ID> = [];
    for (const linkable of linkables) {
      if (this.isID(linkable)) {
        result.push(linkable);
      } else {
        if (linkable._id) {
          result.push(linkable._id as ID);
        } else {
          const linkableInsertResult = await this.relatedCollection.insertOne(
            linkable
          );
          linkable._id = linkableInsertResult.insertedId;
          result.push(linkableInsertResult.insertedId);
        }
      }
    }

    return result;
  }

  /**
   * Cleans the related data for direct links and optionally deletes the related elements in a cascade-like fashion.
   *
   * @param rootId
   * @param options
   */
  protected async cleanDirectLink(rootId: ID, options: CleanOptionsType) {
    const linkStorage: string = this.linker.linkStorageField;

    if (this.linker.isMany()) {
      if (options.delete) {
        const result = await this.collection.findOne(
          { _id: rootId },
          { projection: { [linkStorage]: 1 } }
        );
        if (result[linkStorage]) {
          await this.relatedCollection.deleteMany({
            _id: { $in: result[linkStorage] },
          });
        }
      }

      await this.collection.updateOne(
        { _id: rootId },
        {
          $set: {
            [linkStorage]: [],
          },
        }
      );
    } else {
      if (options.delete) {
        const result = await this.collection.findOne(
          { _id: rootId },
          { projection: { [linkStorage]: 1 } }
        );
        if (result[linkStorage]) {
          await this.relatedCollection.deleteOne({
            _id: result[linkStorage],
          });
        }
      }

      await this.collection.updateOne(
        { _id: rootId },
        {
          $set: {
            [linkStorage]: null,
          },
        }
      );
    }
  }

  /**
   * Cleans the related data for virtual/inversed links and optionally deletes the related elements in a cascade-like fashion.
   *
   * @param rootId
   * @param options
   */
  protected async cleanVirtualLink(rootId: ID, options: CleanOptionsType) {
    const linkStorage: string = this.linker.linkStorageField;

    if (this.linker.isMany()) {
      if (options.delete) {
        await this.relatedCollection.deleteMany({
          [this.linker.linkStorageField]: {
            $in: [rootId],
          },
        });
      } else {
        await this.relatedCollection.updateMany(
          {
            [this.linker.linkStorageField]: {
              $in: [rootId],
            },
          },
          {
            // @ts-ignore
            $pull: {
              [linkStorage]: { $in: [rootId] },
            },
          }
        );
      }
    } else {
      if (options.delete) {
        await this.relatedCollection.deleteOne({
          [this.linker.linkStorageField]: rootId,
        });
      } else {
        await this.relatedCollection.updateOne(
          {
            [this.linker.linkStorageField]: rootId,
          },
          {
            $set: {
              [this.linker.linkStorageField]: null,
            },
          }
        );
      }
    }
  }

  protected isID(id: ID | GenericObject): id is ID {
    return id instanceof ObjectId || id instanceof MongoDB.ObjectId;
  }
}
