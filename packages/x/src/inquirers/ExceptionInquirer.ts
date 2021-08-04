import { Inquirer, Shortcuts } from "@bluelibs/terminal-bundle";
import { GenericModelInquirer } from "./GenericModelInquirer";
import * as _ from "lodash";
import { InquiryUtils } from "../utils/InquiryUtils";
import { ExceptionModel } from "../models/ExceptionModel";

export class ExceptionInquirer extends Inquirer<ExceptionModel> {
  model = new ExceptionModel();

  async inquire() {
    await InquiryUtils.inquireAllBundles(this);

    await this.prompt(
      "exceptionName",
      Shortcuts.input(
        "Enter the name of your exception (eg: PostAlreadyPublished)",
        {
          validate(value) {
            return Boolean(value);
          },
        }
      )
    );

    await this.prompt(
      "hasInterfaceDefined",
      Shortcuts.confirm(
        "Do you want to define a data interface for this exception?",
        true
      )
    );

    const {
      hasInterfaceDefined,
      interfaceDefinition,
      exceptionClass,
    } = this.model;

    if (hasInterfaceDefined) {
      interfaceDefinition.name = `I${exceptionClass}Data`;

      await this.prompt("interfaceDefinition", {
        inquirer: GenericModelInquirer,
        default: this.model.interfaceDefinition,
      });
    }
  }
}
