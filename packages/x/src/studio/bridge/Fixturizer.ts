import { ObjectId } from "@bluelibs/ejson";
import * as Studio from "..";
import { faker } from "@faker-js/faker";
import { FieldValueKind } from "../models/FieldValueKind";
import { Field } from "../models/Field";

export type DataSet = {
  [collection: string]: any[];
};

export class Fixturizer {
  dataSet: DataSet = {};

  constructor(protected readonly app: Studio.App) {}

  getDataSet(): {
    [collection: string]: any[];
  } {
    this.app.collections.forEach((collection) => {
      this.generateForCollection(collection);
    });

    this.generateRelationsForExistingMocks();

    return this.dataSet;
  }

  /**
   * This is done at the very end and it links with documents that exist in the database and not creating new ones for the docs
   */
  generateRelationsForExistingMocks() {
    this.app.collections.forEach((collection) => {
      if (collection.mock.count === 0) {
        return;
      }

      collection.relations.forEach((relation) => {
        let { maxCount, minCount, useExistingDocuments } = relation.mock;
        if (!relation.isMany) {
          minCount = minCount === undefined ? 1 : minCount;
          maxCount = maxCount === undefined ? 1 : maxCount;
        }

        for (const document of this.dataSet[
          collection.getMongoCollectionName()
        ]) {
          if (useExistingDocuments) {
            const relatedCollectionName =
              relation.cleaned.to.getMongoCollectionName();
            const relatedDataSet = this.dataSet[relatedCollectionName];
            const relationalElements = faker.random.arrayElements(
              relatedDataSet,
              faker.datatype.number({
                min: minCount,
                max: maxCount,
              })
            );

            this.storeRelationalData(relation, document, relationalElements);
          }
        }
      });
    });
  }

  /**
   * Generates and stores documents inside the collection
   * @param collection
   */
  generateForCollection(collection: Studio.Collection) {
    const count = collection.mock.count;

    for (let i = 0; i < count; i++) {
      this.generateDocumentForCollection(collection);
    }
  }

  /**
   * Generates and stores document in the dataStore for the collection.
   * @param collection
   * @returns
   */
  generateDocumentForCollection(collection: Studio.Collection): object {
    this.dataSet[collection.getMongoCollectionName()] =
      this.dataSet[collection.getMongoCollectionName()] || [];

    let document: any = {
      _id: new ObjectId(),
    };

    this.dataSet[collection.getMongoCollectionName()].push(document);

    collection.fields
      .filter(
        (f) => !f.isReducer && !f.isRelationStorageField && f.id !== "_id"
      )
      .forEach((field) => {
        if (field.isArray && field.subfields.length > 0) {
          const count = faker.datatype.number({
            min: field.mock.minCount,
            max: field.mock.maxCount,
          });
          document[field.id] = [];
          for (let i = 0; i < count; i++) {
            document[field.id].push(field.mock.generator());
          }
        } else {
          document[field.id] = field.mock.generator();
        }
      });

    collection.relations.forEach((_relation) => {
      const { maxCount, minCount, useExistingDocuments } = _relation.mock;

      // WE ARE CREATING THESE DOCUMENTS DEEPLY
      if (maxCount && !useExistingDocuments) {
        const result = [];
        const count = faker.datatype.number({
          min: minCount,
          max: maxCount,
        });
        for (let i = 0; i < count; i++) {
          result.push(this.generateDocumentForCollection(_relation.cleaned.to));
        }

        this.storeRelationalData(_relation, document, result);
      }
    });

    return document;
  }

  /**
   * This uses the relation config, the document, and what to store
   * @param _relation
   * @param document
   * @param result
   */
  protected storeRelationalData(
    _relation: Studio.Relation,
    document: any,
    result: any[]
  ) {
    const relation = _relation.cleaned;

    if (relation.isDirect) {
      if (relation.isMany) {
        document[relation.field.id] = result.map((r) => r._id);
      } else {
        document[relation.field.id] = result.length ? result[0]._id : null;
      }
    } else {
      const reversedRelation = relation.reversedRelation;
      const storage = reversedRelation.cleaned.field.id;

      result.forEach((r) => {
        r[storage] = reversedRelation.isMany ? [document._id] : document._id;
      });
    }
  }

  static getRandomGenerator(field: Field) {
    const endgameGenerator = (fn) => {
      if (field.isArray) {
        return () => [fn()];
      }
      return fn;
    };
    switch (field.type) {
      case FieldValueKind.BOOLEAN:
        if (field.isArray) {
          // who in the world would have an array of bools?
          return () => faker.random.arrayElements([true, false]);
        } else {
          return () => faker.random.arrayElement([true, false]);
        }
      case FieldValueKind.DATE:
        return endgameGenerator(faker.date.recent);
      case FieldValueKind.ENUM:
        if (field.isArray) {
          return () => {
            return faker.random.arrayElements(
              field.enumValues.map((e) => e.value)
            );
          };
        } else {
          return () =>
            faker.random.arrayElement(field.enumValues.map((e) => e.value));
        }
      case FieldValueKind.FLOAT:
        return endgameGenerator(faker.datatype.number);
      case FieldValueKind.INTEGER:
        return endgameGenerator(faker.datatype.number);
      case FieldValueKind.OBJECT_ID:
        // TODO: should not have such a thing? as this would be a realation
        return endgameGenerator(() => new ObjectId());
      case FieldValueKind.STRING:
        // Make this smarter, maybe try to infer it from the name of the field
        return endgameGenerator(
          Fixturizer.getGeneratorByNameForString(field.id)
        );
      case FieldValueKind.OBJECT:
        const generateSubdocument = () => {
          const fields = field.model
            ? field.cleaned.model.fields
            : field.subfields;
          const subdocument = {};
          fields.forEach((subfield) => {
            subdocument[subfield.id] = subfield.mock.generator();
          });

          return subdocument;
        };

        if (field.isArray) {
          // TODO: maybe offer a set of 3-4
          return () => {
            const result = [];
            const elementsNb = (Math.random() * 10) % 4;
            for (let i = 0; i < elementsNb; i++) {
              result.push(generateSubdocument());
            }

            return result;
          };
        } else {
          return () => {
            // Single one
            return generateSubdocument();
          };
        }
    }
  }

  static getGeneratorByNameForString(fieldName: string): () => string {
    if (fieldName === "name") {
      return () => faker.lorem.word(10);
    }

    if (faker.name[fieldName]) {
      return faker.name[fieldName];
    }

    if (["phone", "phoneNumber"].includes(fieldName)) {
      return faker.phone.phoneNumber;
    }

    if (faker.address[fieldName]) {
      return faker.address[fieldName];
    }

    if (fieldName === "street") {
      return faker.address.streetAddress;
    }

    if (["postCode", "postalCode"].includes(fieldName)) {
      return faker.address.zipCode;
    }

    if (faker.internet[fieldName]) {
      return faker.internet[fieldName];
    }

    if (["description", "comment", "text", "details"].includes(fieldName)) {
      return () => faker.lorem.sentence(30);
    }

    return () => faker.lorem.word(10);
  }
}
