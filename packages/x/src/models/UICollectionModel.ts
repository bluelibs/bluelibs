import * as Studio from "../studio";
import { Relation } from "../studio";

export class UICollectionModel {
  bundleName: string;
  collectionName: string; // Users
  entityName: string; // User
  collectionEndpoint: string; // Users (refers to the graphql module path)
  studioCollection: Studio.Collection;
  hasCustomInputs: boolean = false;

  collectionClassNamesOfInterest(): string[] {
    const names = this.studioCollection.relations
      .filter((r) => !r.isFileRelated())
      .map((relation) => {
        return relation.cleaned.to.id + "Collection";
      });

    names.push(this.studioCollection.id + "Collection");

    function onlyUnique(value, index, self) {
      return self.indexOf(value) === index;
    }

    return names.filter(onlyUnique);
  }

  collectionClassNamesOfInterestExcludingMyself(): string[] {
    return this.collectionClassNamesOfInterest().filter(
      (v) => v !== this.studioCollection.id + "Collection"
    );
  }

  dateFields(): string[] {
    return this.studioCollection.fields
      .filter((field) => {
        return field.type === Studio.Field.Types.DATE;
      })
      .map((field) => {
        return field.id;
      });
  }

  objectIdFields(): string[] {
    return this.studioCollection.fields
      .filter((field) => {
        return (
          field.type === Studio.Field.Types.OBJECT_ID && field.isArray === false
        );
      })
      .map((f) => f.id);
  }

  objectIdsFields(): string[] {
    return this.studioCollection.fields
      .filter((field) => {
        return (
          field.type === Studio.Field.Types.OBJECT_ID && field.isArray === true
        );
      })
      .map((f) => f.id);
  }

  hasFiles(): boolean {
    return this.studioCollection.relations.some((r) => r.isFileRelated());
  }

  links(): any[] {
    // const isNotFile = (relation: Relation) => !relation.isFileRelated();

    const directLinks = this.studioCollection.relations
      .filter((r) => r.isDirect && r.enableGraphQL)
      // .filter(isNotFile)
      .map((relation) => {
        const r = relation.cleaned;
        return {
          collectionClass: r.to.id + "Collection",
          name: r.id,
          field: r.field.id,
          many: r.isMany,
        };
      });

    const inversedLinks = this.studioCollection.relations
      .filter((r) => !r.isDirect && r.enableGraphQL)
      // .filter(isNotFile)
      .map((relation) => {
        const r = relation.cleaned;
        return {
          collectionClass: r.to.id + "Collection",
          name: r.id,
          many: r.isMany,
        };
      });

    return [...directLinks, ...inversedLinks];
  }
}
