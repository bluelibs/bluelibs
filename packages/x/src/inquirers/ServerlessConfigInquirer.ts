import { Inquirer, Shortcuts } from "@bluelibs/terminal-bundle";
import { InquiryUtils } from "../utils";
import { ServerlessConfigModel } from "../models/ServerlessConfigModel";

export class ServerlessConfigInquirer extends Inquirer<ServerlessConfigModel> {
  model = new ServerlessConfigModel();

  async inquire() {
    await this.prompt(
      "service",
      Shortcuts.input("enter name of service", { default: "aws-service" })
    );
    await this.prompt(
      "provider",
      Shortcuts.input("what type of serverless provider you want", {
        default: "aws",
      })
    );
  }
}
