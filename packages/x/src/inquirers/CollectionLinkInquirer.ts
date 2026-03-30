import { Inquirer, Shortcuts } from "@bluelibs/terminal-bundle";
import { InquiryUtils } from "../utils/InquiryUtils";
import { CollectionLinkModel } from "../models/CollectionLinkModel";
import { XElementType } from "../utils/XElements";

export class CollectionLinkInquirer extends Inquirer<CollectionLinkModel> {
  model = new CollectionLinkModel();

  async inquire() {
    await InquiryUtils.inquireXElement(
      this,
      "collectionAElement",
      XElementType.COLLECTION
    );

    await InquiryUtils.inquireXElement(
      this,
      "collectionBElement",
      XElementType.COLLECTION
    );

    const { collectionAElement, collectionBElement } = this.model;

    await this.prompt(
      "whereIsTheLinkStored",
      Shortcuts.autocomplete(
        "Where is the link information stored?",
        [
          {
            id: collectionAElement.identityNameRaw,
            value: "A",
          },
          {
            id: collectionBElement.identityNameRaw,
            value: "B",
          },
        ],
        {},
        {
          defaultValue: "A",
        }
      )
    );

    const firstChoice =
      this.model.whereIsTheLinkStored === "A"
        ? collectionAElement.identityNameRaw
        : collectionBElement.identityNameRaw;

    const secondChoice =
      this.model.whereIsTheLinkStored === "B"
        ? collectionAElement.identityNameRaw
        : collectionBElement.identityNameRaw;

    await this.prompt(
      "type",
      Shortcuts.autocomplete("How do we link these collections?", [
        {
          value: "oneToOne",
          id: `${firstChoice} (one to one) ${secondChoice}`,
        },
        {
          value: "oneToMany",
          id: `${firstChoice} (one to many) ${secondChoice}`,
        },
        {
          value: "manyToOne",
          id: `${firstChoice} (many to one) ${secondChoice}`,
        },
        {
          value: "manyToMany",
          id: `${firstChoice} (many to many) ${secondChoice}`,
        },
      ])
    );

    // TODO: We have the info to offer good guesses for collection links and field names and provide good defaults
    await this.prompt(
      "linkFromA",
      Shortcuts.input(
        `Enter the link name from collection ${collectionAElement.identityNameRaw} -> ${collectionBElement.identityNameRaw}: `
      )
    );

    await this.prompt(
      "linkFromB",
      Shortcuts.input(
        `Enter the link name from collection ${collectionBElement.identityNameRaw} -> ${collectionAElement.identityNameRaw}: `,
        {}
      )
    );

    await this.prompt(
      "fieldName",
      Shortcuts.input("Enter the field name for collection linking storage: ", {
        // ""
      })
    );
  }
}
