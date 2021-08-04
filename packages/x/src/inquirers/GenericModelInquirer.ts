import { Inquirer, Shortcuts } from "@bluelibs/terminal-bundle";
import { CreateBundleModel } from "../models";
import { FSUtils } from "../utils/FSUtils";
import { GenericModel } from "../models/GenericModel";
import { GenericFieldInquirer } from "./GenericFieldInquirer";
import { ModelRaceEnum } from "../models/defs";

export class GenericModelInquirer extends Inquirer<GenericModel> {
  model = new GenericModel("", ModelRaceEnum.CLASSLIKE);

  async inquire() {
    if (!this.model._skipModelNameQuestion) {
      await this.prompt(
        "name",
        Shortcuts.input(
          `What is the ${this.model.modelTypeName}'s name? (eg: User)`,
          {
            validate(value) {
              return Boolean(value);
            },
          }
        )
      );
    }

    const addFields = await this.prompter.prompt(
      Shortcuts.confirm("Do you want to add some fields now?", true)
    );

    if (addFields) {
      await this.prompt(
        "fields",
        {
          inquirer: GenericFieldInquirer,
        },
        {
          many: true,
          autocontinue: true,
        }
      );
    }
  }
}
