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
import { FixtureModel } from "../models/FixtureModel";

export class FixtureInquirer extends Inquirer<FixtureModel> {
  @Inject(() => ContainerInstance)
  protected container: ContainerInstance;

  model = new FixtureModel();

  async inquire() {
    await InquiryUtils.inquireAllBundles(this);

    await InquiryUtils.inquireXElement(
      this,
      "collectionElement",
      XElementType.COLLECTION,
      "Select collection for which you want to generate fixtures"
    );

    await this.prompt(
      "fixtureName",
      Shortcuts.input("What is the name of your fixture?", {
        default: _.lowerFirst(this.model.collectionElement.identityNameRaw),
      })
    );
  }
}
