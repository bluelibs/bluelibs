import { Inquirer, Shortcuts } from "@bluelibs/terminal-bundle";
import { GenericModelInquirer } from "./GenericModelInquirer";
import * as _ from "lodash";
import { ContainerInstance, Inject } from "@bluelibs/core";
import { InquiryUtils } from "../utils/InquiryUtils";
import { GraphQLInputModel } from "../models/GraphQLInputModel";
import { ModelRaceEnum } from "../models/defs";
import { GraphQLEntityModel } from "../models/GraphQLEntityModel";

export class GraphQLEntityInquirer extends Inquirer<GraphQLInputModel> {
  @Inject(() => ContainerInstance)
  protected container: ContainerInstance;

  model = new GraphQLEntityModel();

  async inquire() {
    const modelInquirer = this.container.get(GenericModelInquirer);

    await InquiryUtils.inquireAllBundles(this);

    modelInquirer.model = this.model.genericModel;
    await modelInquirer.inquire();
  }
}
