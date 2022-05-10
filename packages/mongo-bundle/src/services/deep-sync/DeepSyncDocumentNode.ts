import { DeepPartial } from "@bluelibs/core";
import * as MongoDB from "mongodb";
import { Linker, LINK_STORAGE } from "@bluelibs/nova";
import { Collection, MONGO_BUNDLE_COLLECTION } from "../../models/Collection";
import { Collection as MongoCollection, ClientSession } from "mongodb";
import { ObjectId } from "@bluelibs/ejson";

/**
 * This represents the fact that the current object has been processed, and on flushing, it should be ignored
 */
const CREATED = Symbol("CREATED");
const PERSISTED = Symbol("PERSISTED");
const IN_FLUSH = Symbol("IN_FLUSH");
const NODE = Symbol("NODE");

export type DeepSyncOptionsType = {
  direct?: boolean;
};

/**
 * Graph-like solution to persist related data to the database
 */
export class DeepSyncDocumentNode {
  collection: MongoCollection<any>;
  /**
   * Represents the model we are playing with.
   */
  data: any;

  /**
   * Here is the data that does not contain and links, it has been
   */
  databaseObject: DeepPartial<any>;

  links: Array<{
    id: string;
    nodes: DeepSyncDocumentNode[];
    collection: MongoCollection<any>;
    // Virtual refers to the fact that storage is stored on the other side.
    linker: Linker;
  }> = [];

  _id?: ObjectId | MongoDB.ObjectId;

  options: DeepSyncOptionsType;

  inFlush: boolean = false;

  constructor(
    collection: MongoCollection<any>,
    data: any,
    options?: DeepSyncOptionsType
  ) {
    this.collection = collection;
    const plain = Object.assign({}, data);
    this.data = data;
    this.data[NODE] = this;
    this.options = options;

    this.storeLinkData(plain);

    this.databaseObject = plain;
    this._id = (data as any)._id;
  }

  private storeLinkData(plain: any) {
    const linkInfos = this.collection[LINK_STORAGE];
    for (const linkName in linkInfos) {
      const linker = linkInfos[linkName] as Linker;
      if (plain[linkName]) {
        const linkedCollection = linker.getLinkedCollection();
        const nodes: DeepSyncDocumentNode[] = [];
        if (Array.isArray(plain[linkName])) {
          plain[linkName].forEach((element) => {
            if (element[NODE]) {
              nodes.push(element[NODE]);
            } else {
              nodes.push(
                new DeepSyncDocumentNode(
                  linkedCollection,
                  element,
                  this.options
                )
              );
            }
          });
        } else {
          nodes.push(
            plain[linkName][NODE]
              ? plain[linkName][NODE]
              : new DeepSyncDocumentNode(
                  linkedCollection,
                  plain[linkName],
                  this.options
                )
          );
        }

        this.links.push({
          id: linkName,
          collection: linkedCollection,
          linker: linker,
          nodes: nodes,
        });

        delete plain[linkName];
      }
    }
  }

  async flush(options: any = {}) {
    if (this.inFlush) {
      return;
    } else {
      this.inFlush = true;
    }

    // first insert direct links
    await this.processDirectLinks(options);

    // expand plain for direct link ids
    await this.persist(options);

    // process the links where relation is on the other side
    await this.processVirtualLinks(options);

    // Keep'em in sync with the latest updates.
    Object.assign(this.data, this.databaseObject);

    // Object cleanups
    delete this.data[NODE];
  }

  /**
   * Process the direct links to allow propper of _id
   */
  protected async processDirectLinks(options: any = {}) {
    const directLinks = this.links.filter((link) => !link.linker.isVirtual());

    for (const directLink of directLinks) {
      if (directLink.nodes.length === 0) {
        continue;
      }

      for (const node of directLink.nodes) {
        await node.flush(options);
      }

      if (directLink.linker.isSingle()) {
        this.databaseObject[directLink.linker.linkStorageField] =
          directLink.nodes[0]._id;
      } else {
        this.databaseObject[directLink.linker.linkStorageField] =
          directLink.nodes.map((n) => n._id);
      }
    }
  }

  /**
   * Process links in which storage is stored after
   * Should be run once I have an _id
   */
  protected async processVirtualLinks(options: any = {}) {
    const virtualLinks = this.links.filter((link) => link.linker.isVirtual());

    for (const virtualLink of virtualLinks) {
      virtualLink.nodes.forEach((node) => {
        if (virtualLink.linker.isSingle()) {
          node.databaseObject[virtualLink.linker.linkStorageField] = this._id;
        } else {
          node.databaseObject[virtualLink.linker.linkStorageField] = [this._id];
        }
      });

      for (const node of virtualLink.nodes) {
        await node.flush(options);
      }
    }
  }

  /**
   * Persists the document and returns the _id if it exists
   */
  protected async persist(options: any = {}) {
    const collection = this.collection[MONGO_BUNDLE_COLLECTION] as Collection;
    const actualCollection = this.options.direct
      ? collection.collection
      : collection;

    if (this._id) {
      const { _id, ...rest } = this.databaseObject;
      if (Object.keys(rest).length > 0) {
        // sometimes it's just an _id to link with the direct part
        await actualCollection.updateOne(
          { _id },
          {
            $set: rest,
          },
          options
        );
      }
    } else {
      const result = await actualCollection.insertOne(
        this.databaseObject,
        options
      );
      this._id = result.insertedId;
    }

    this.databaseObject._id = this._id;
  }
}
