import { Inquirer, Shortcuts } from "@bluelibs/terminal-bundle";
import { EmailTemplateModel } from "../models/EmailTemplateModel";
import { InquiryUtils } from "../utils";
import { BlueprintCollectionModel } from "../models/BlueprintCollectionModel";

export class BlueprintCollectionInquirer extends Inquirer<BlueprintCollectionModel> {
  model = new BlueprintCollectionModel();

  async inquire() {
    await this.prompt(
      "collections",
      Shortcuts.input(
        "Enter your collection name or a list of them comma separated"
      )
    );
  }
}
