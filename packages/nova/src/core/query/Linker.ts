import * as _ from "lodash";
import { Collection } from "mongodb";
import { LINK_STORAGE } from "../constants";
import { ILinkCollectionOptions, HardwiredFiltersOptions } from "../defs";

export enum LinkStrategy {
  ONE,
  MANY,
}

export default class Linker<T = any> {
  public mainCollection: Collection<T>;
  public linkConfig: ILinkCollectionOptions & {
    strategy: LinkStrategy;
  };
  public linkName: string;
  public inversedBy: string;
  private _relatedLinker: Linker;

  /**
   * @param mainCollection
   * @param linkName
   * @param linkConfig
   */
  constructor(
    mainCollection: Collection<T>,
    linkName: string,
    linkConfig: ILinkCollectionOptions
  ) {
    this.mainCollection = mainCollection;

    this.linkConfig = {
      ...linkConfig,
      strategy: linkConfig.many ? LinkStrategy.MANY : LinkStrategy.ONE,
    };

    this.linkName = linkName;

    // check linkName must not exist in schema
    this._validateAndClean();

    if (!this.isVirtual() && linkConfig.index === true) {
      mainCollection.createIndex({ [linkConfig.field]: 1 });

      if (linkConfig.foreignField) {
        this.getLinkedCollection().createIndex({
          [linkConfig.foreignField]: 1,
        });
      }
    }
  }

  /**
   * Returns the hard wired filters
   * @param options
   * @returns
   */
  getHardwiredFilters(options: HardwiredFiltersOptions = {}) {
    if (this.linkConfig.filters) {
      if (typeof this.linkConfig.filters === "function") {
        return this.linkConfig.filters(options);
      } else {
        return this.linkConfig.filters;
      }
    }

    return {};
  }

  get relatedLinker(): Linker {
    if (!this._relatedLinker) {
      const targetCollection = this.linkConfig.collection();
      const linkStorage = targetCollection[LINK_STORAGE];

      if (this.isVirtual()) {
        const { inversedBy } = this.linkConfig;
        const relatedLinker = linkStorage[inversedBy];

        if (!relatedLinker) {
          throw new Error(
            `It seems that you have setup an inversed ${inversedBy} link without declaring the main link`
          );
        }

        this._relatedLinker = relatedLinker;
      }
    }

    return this._relatedLinker;
  }

  /**
   * Returns the strategies: one, many, one-meta, many-meta
   * @returns {string}
   */
  get strategy() {
    return this.linkConfig.strategy;
  }

  /**
   * Returns the field name in the document where the actual relationships are stored.
   * @returns {string}
   */
  get linkStorageField(): string {
    if (this.isVirtual()) {
      return this.relatedLinker.linkStorageField;
    }

    return this.linkConfig.field;
  }

  /**
   * Returns the field name in the document where the actual relationships are stored.
   * @returns {string}
   */
  get linkForeignStorageField(): string {
    if (this.isVirtual()) {
      return this.relatedLinker.linkForeignStorageField ?? "_id";
    }

    return this.linkConfig.foreignField ?? "_id";
  }

  /**
   * Returns the collection towards which the link is made
   */
  public getLinkedCollection() {
    return this.linkConfig.collection();
  }

  /**
   * If the relationship for this link is of "many" type.
   */
  public isMany() {
    if (this.isVirtual()) {
      return this.relatedLinker.isMany();
    }

    return Boolean(this.linkConfig.many);
  }

  /**
   * @returns {boolean}
   */
  public isSingle() {
    if (this.isVirtual()) {
      return this.relatedLinker.isSingle();
    }

    return !this.isMany();
  }

  /**
   * Is the Linker comes from the main collection of a relationship.
   * @returns {boolean}
   * @returns {true} true - The Linker comes from the collection that physically stores the foreignKey
   * @returns {false} false - The Linker comes from the collection that is virtually related to the main collection. And thus reversing the relationship
   */
  public isVirtual() {
    return Boolean(this.linkConfig.inversedBy);
  }

  /**
   * Should return a single result.
   */
  public isOneResult() {
    return (
      (this.isVirtual() && this.relatedLinker.linkConfig.unique) ||
      (!this.isVirtual() && this.isSingle())
    );
  }

  /**
   * Returns the aggregation pipeline
   */
  public getLookupAggregationPipeline(options: IGetLookupOperatorOptions = {}) {
    const localField = this.isVirtual()
      ? this.linkForeignStorageField
      : this.linkStorageField;
    const foreignField = this.isVirtual()
      ? this.linkStorageField
      : this.linkForeignStorageField;

    let matches = this.createAggregationMatches(foreignField);

    const result: any = {
      from: this.getLinkedCollection().collectionName,
      let: {
        localField: `$${localField}`,
      },
      as: options.as || this.linkName,
      pipeline: [
        {
          $match: { $expr: { $and: matches } },
        },
        ...(options.pipeline ? options.pipeline : []),
      ],
    };

    // console.log(JSON.stringify(result, null, 4));

    return {
      $lookup: result,
    };
  }

  /**
   * This function allows us to use the aggregation pipeline fully
   * @param foreignField
   */
  private createAggregationMatches(foreignField: any) {
    let matches = [];
    if (this.isVirtual()) {
      if (this.isMany()) {
        matches.push(
          {
            $isArray: `$${foreignField}`,
          },
          {
            $in: [`$$localField`, `$${foreignField}`],
          }
        );
      } else {
        matches.push({
          $eq: [`$${foreignField}`, `$$localField`],
        });
      }
    } else {
      if (this.isMany()) {
        matches.push(
          { $isArray: `$$localField` },
          {
            $in: [`$${foreignField}`, `$$localField`],
          }
        );
      } else {
        matches.push({
          $eq: [`$$localField`, `$${foreignField}`],
        });
      }
    }
    return matches;
  }

  /**
   * @returns {*}
   * @private
   */
  private _validateAndClean() {
    if (!this.linkConfig.collection) {
      throw new Error(
        `For the link ${this.linkName} you did not provide a collection.`
      );
    }

    if (this.linkConfig.field == this.linkName) {
      throw new Error(
        `For the link ${this.linkName} you must not use the same name for the field, otherwise it will cause conflicts when fetching data`
      );
    }
  }
}

export interface IGetLookupOperatorOptions {
  pipeline?: any[];
  as?: string;
}
