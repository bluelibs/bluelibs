import { Inquirer, Shortcuts } from "@bluelibs/terminal-bundle";
import { EmailTemplateModel } from "../models/EmailTemplateModel";
import { InquiryUtils } from "../utils";
import { BlueprintSharedModelModel } from "../models/BlueprintSharedModelModel";

export class BlueprintSharedModelInquirer extends Inquirer<BlueprintSharedModelModel> {
  model = new BlueprintSharedModelModel();

  async inquire() {
    await this.prompt(
      "names",
      Shortcuts.input(
        "Enter your shared model name or a list of them comma separated"
      )
    );
  }
}
