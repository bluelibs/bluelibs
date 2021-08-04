import { Inquirer, Shortcuts } from "@bluelibs/terminal-bundle";
import { CreateBundleModel } from "../models";
import { FSUtils } from "../utils/FSUtils";

export class CreateBundleInquirer extends Inquirer<CreateBundleModel> {
  model = new CreateBundleModel();

  async inquire() {
    const nearest = FSUtils.getNearest("microservice");

    await this.prompt(
      "bundleName",
      Shortcuts.input("Enter the name of your bundle (eg: invoice)")
    );

    await this.prompt(
      "containsGraphQL",
      Shortcuts.confirm("Does this bundle use GraphQL?", true)
    );

    await this.prompt(
      "containsServerRoutes",
      Shortcuts.confirm("Would this bundle expose server routes?", true)
    );
  }
}
