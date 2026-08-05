import { IDocumentBase, IDType } from "../defs";
export class DocumentStore<T extends IDocumentBase> {
  protected documents: T[] = [];

  get length() {
    return this.documents.length;
  }

  all() {
    return this.documents;
  }

  get(_id: T["_id"]) {
    return this.documents.find((document) => this.equals(document._id, _id));
  }

  add(document: T) {
    this.documents.push(document);
  }

  contains(_id: T["_id"]) {
    return Boolean(
      this.documents.find((document) => this.equals(document._id, _id))
    );
  }

  remove(_id: T["_id"]) {
    this.documents = this.documents.filter((document) => {
      return !this.equals(document._id, _id);
    });
  }

  update(_id: T["_id"], newSet: Partial<T>) {
    const document = this.get(_id);

    return Object.assign(document, newSet);
  }

  shutdown() {
    this.documents = [];
  }

  equals(_id1: IDType, _id2: IDType) {
    return DocumentStore.equals(_id1, _id2);
  }

  static equals(_id1: IDType, _id2: IDType) {
    if (typeof _id1 === "object" || typeof _id2 === "object") {
      return _id1.toString() === _id2.toString();
    } else {
      return _id1 === _id2;
    }
  }

  static includes(arrayOfIds: IDType[], _id: IDType) {
    for (const _id2 of arrayOfIds) {
      if (DocumentStore.equals(_id2, _id)) {
        return true;
      }
    }

    return false;
  }
}
