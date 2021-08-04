import { Inquirer, Shortcuts } from "@bluelibs/terminal-bundle";
import * as _ from "lodash";
import { ContainerInstance, Inject } from "@bluelibs/core";
import { InquiryUtils } from "../utils/InquiryUtils";
import { XElements, XElementType } from "../utils/XElements";
import { GraphQLCRUDModel } from "../models/GraphQLCRUDModel";
import { GenericModelInquirer } from "./GenericModelInquirer";
import { GenericModel } from "../models";

export class GraphQLCRUDInquirer extends Inquirer<GraphQLCRUDModel> {
  @Inject(() => ContainerInstance)
  protected container: ContainerInstance;

  model = new GraphQLCRUDModel();

  async inquire() {
    await InquiryUtils.inquireAllBundles(this);

    await this.prompt(
      "crudName",
      Shortcuts.input("What is the CRUD's name (eg: adminUsers)")
    );

    await this.prompt(
      "hasCustomInputs",
      Shortcuts.confirm("Do you want to have EJSON inputs?", true)
    );
    this.model.hasCustomInputs = !this.model.hasCustomInputs;

    if (this.model.hasCustomInputs) {
      this.model.insertInputModelDefinition = new GenericModel();
      this.model.insertInputModelDefinition._skipModelNameQuestion = true;
      await this.prompt("insertInputModelDefinition", {
        inquirer: GenericModelInquirer,
      });

      this.model.updateInputModelDefinition = new GenericModel();
      this.model.updateInputModelDefinition._skipModelNameQuestion = true;
      await this.prompt("updateInputModelDefinition", {
        inquirer: GenericModelInquirer,
      });
    }

    await InquiryUtils.inquireXElement(
      this,
      "collectionElement",
      XElementType.COLLECTION
    );

    await InquiryUtils.inquireXElement(
      this,
      "graphqlEntityElement",
      XElementType.GRAPHQL_ENTITY
    );

    await this.prompt(
      "hasSubscriptions",
      Shortcuts.confirm("Enable subscriptions?", true)
    );
  }
}
