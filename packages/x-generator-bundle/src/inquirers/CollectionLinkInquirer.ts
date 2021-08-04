import { Inquirer, Shortcuts } from "@bluelibs/terminal-bundle";
import { CreateBundleModel, GenericModel } from "../models";
import { FSUtils } from "../utils/FSUtils";
import { CollectionModel } from "../models/CollectionModel";
import { GenericModelInquirer } from "./GenericModelInquirer";
import * as _ from "lodash";
import { ContainerInstance, Inject } from "@bluelibs/core";
import { InquiryUtils } from "../utils/InquiryUtils";
import { GraphQLInputModel } from "../models/GraphQLInputModel";
import { ModelRaceEnum, GenericFieldTypeEnum } from "../models/defs";
import { GraphQLCollectionMutationOperation } from "../models/GraphQLMutationModel";
import { XElements, XElementType } from "../utils/XElements";
import { CollectionLinkModel } from "../models/CollectionLinkModel";
import {
  GraphQLMutationModel,
  MutationDelegateType,
} from "../models/GraphQLMutationModel";

export class CollectionLinkInquirer extends Inquirer<CollectionLinkModel> {
  @Inject(() => ContainerInstance)
  protected container: ContainerInstance;

  model = new CollectionLinkModel();

  async inquire() {
    await InquiryUtils.inquireXElement(
      this,
      "collectionAElement",
      XElementType.COLLECTION,
      "Select collection A"
    );

    await InquiryUtils.inquireXElement(
      this,
      "collectionBElement",
      XElementType.COLLECTION,
      "Select collection B"
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
