import { IDocumentBase } from "../defs";
export class DocumentStore<T extends IDocumentBase> {
  protected documents: T[] = [];

  get length() {
    return this.documents.length;
  }

  all() {
    return this.documents;
  }

  get(_id) {
    return this.documents.find((document) => this.equals(document._id, _id));
  }

  add(document: T) {
    this.documents.push(document);
  }

  contains(_id) {
    return Boolean(
      this.documents.find((document) => this.equals(document._id, _id))
    );
  }

  remove(_id) {
    this.documents = this.documents.filter((document) => {
      return !this.equals(document._id, _id);
    });
  }

  update(_id, newSet) {
    const document = this.get(_id);

    return Object.assign(document, newSet);
  }

  shutdown() {
    this.documents = [];
  }

  equals(_id1, _id2) {
    return DocumentStore.equals(_id1, _id2);
  }

  static equals(_id1, _id2) {
    if (typeof _id1 === "object" || typeof _id2 === "object") {
      return _id1.toString() === _id2.toString();
    } else {
      return _id1 === _id2;
    }
  }

  static includes(arrayOfIds: any[], _id) {
    for (const _id2 of arrayOfIds) {
      if (DocumentStore.equals(_id2, _id)) {
        return true;
      }
    }

    return false;
  }
}
