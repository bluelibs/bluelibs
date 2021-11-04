import * as _ from "lodash";
import { GenericModel } from "./GenericModel";

export class CollectionModel {
  bundleName: string;
  collectionName: string;

  isTimestampable: boolean;
  isSoftdeletable: boolean;
  isBlameable: boolean;

  modelDefinition: GenericModel;
  validateAgainstModel: boolean;

  createEntity: boolean;
  isEntitySameAsModel: boolean;
  entityDefinition: GenericModel;

  hasSubscriptions: boolean = false;

  /**
   * Should we override the .collection.ts file if it exists?
   */
  overrideCollectionIfExists: boolean = true;

  /**
   * This refers when the collection extends something else (We use it for Users to extend from SecurityMongoBundle)
   */
  customCollectionImport: string; // "@bluelibs/security-mongo-bundle";
  customCollectionName: string; // "UsersCollection"

  constructor() {}

  // links: ILink;
  get collectionModelClass() {
    return this.modelDefinition.name;
  }

  get containsBehaviors() {
    return (
      this.hasSubscriptions ||
      this.isTimestampable ||
      this.isSoftdeletable ||
      this.isBlameable ||
      this.validateAgainstModel
    );
  }

  get collectionNameMongo() {
    return _.camelCase(this.collectionName);
  }

  get collectionNameUpper() {
    return _.upperFirst(this.collectionName);
  }

  get collectionClass() {
    const propperForm = _.upperFirst(this.collectionName);

    return propperForm + "Collection";
  }
}

export enum BehaviorsEnum {
  TIMESTAMPABLE = "Timestampable",
  SOFTDELETABLE = "Softdeletable",
  VALIDATABLE = "Validatable",
  BLAMEABLE = "Blameable",
}
