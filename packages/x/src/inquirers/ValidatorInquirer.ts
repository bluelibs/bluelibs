import { Inquirer, Shortcuts } from "@bluelibs/terminal-bundle";
import { CreateBundleModel, GenericModel } from "../models";
import { FSUtils } from "../utils/FSUtils";
import { CollectionModel } from "../models/CollectionModel";
import { GenericModelInquirer } from "./GenericModelInquirer";
import * as _ from "lodash";
import { InquiryUtils } from "../utils/InquiryUtils";
import { EventModel } from "../models/EventModel";
import { ValidatorModel } from "../models/ValidatorModel";
import { YupFieldMap } from "../utils/ModelUtils";

export class ValidatorInquirer extends Inquirer<ValidatorModel> {
  model = new ValidatorModel();

  async inquire() {
    await InquiryUtils.inquireAllBundles(this);

    await this.prompt(
      "validatorName",
      Shortcuts.input(
        "Enter the name of your event (eg: gitHubUsernameExists)",
        {
          validate(value) {
            return Boolean(value);
          },
        }
      )
    );

    await this.prompt(
      "yupValidationType",
      Shortcuts.autocomplete(
        "What kind of field is this validating against?",
        Object.values(YupFieldMap)
      )
    );
  }
}
