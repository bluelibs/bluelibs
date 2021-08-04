import { Inquirer, Shortcuts } from "@bluelibs/terminal-bundle";
import { CreateBundleModel, GenericModel } from "../models";
import { FSUtils } from "../utils/FSUtils";
import { CollectionModel } from "../models/CollectionModel";
import { GenericModelInquirer } from "./GenericModelInquirer";
import * as _ from "lodash";
import { InquiryUtils } from "../utils/InquiryUtils";
import { ServiceModel } from "../models/ServiceModel";

export class ServiceInquirer extends Inquirer<ServiceModel> {
  model = new ServiceModel();

  async inquire() {
    await InquiryUtils.inquireAllBundles(this);

    await this.prompt(
      "serviceName",
      Shortcuts.input("Enter the name of your service (eg: Post)", {
        validate(value) {
          return Boolean(value);
        },
      })
    );

    await this.prompt(
      "injectContainer",
      Shortcuts.confirm("Inject Container?", false)
    );
    await this.prompt(
      "injectEventManager",
      Shortcuts.confirm("Inject Event Manager?", true)
    );

    await this.prompt(
      "methods",
      Shortcuts.input("You can write some comma separated methods: ", true)
    );
  }
}
