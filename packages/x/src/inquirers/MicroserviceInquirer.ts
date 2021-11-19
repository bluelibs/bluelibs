import { Inquirer, Shortcuts } from "@bluelibs/terminal-bundle";
import { MicroserviceModel, MicroserviceTypeEnum } from "../models";
import { FSUtils } from "../utils/FSUtils";
import * as path from "path";
import { NearestElementNotFoundException } from "../exceptions/NearestElementNotFound.exception";

export class MicroserviceInquirer extends Inquirer<MicroserviceModel> {
  model = new MicroserviceModel();

  async inquire() {
    try {
      const nearest = FSUtils.getNearest("project");
    } catch (e) {
      if (e instanceof NearestElementNotFoundException) {
        // It's ok
        console.log(
          `This microservice is not part of any project. We will create it in your current folder: ${process.cwd()}`
        );
      } else {
        throw e;
      }
    }

    await this.prompt(
      "type",
      Shortcuts.autocomplete(
        "Enter the type",
        Object.values(MicroserviceTypeEnum)
      )
    );

    await this.prompt(
      "name",
      Shortcuts.input("Enter the name of the microservice")
    );
    if (
      [
        MicroserviceTypeEnum.FRONTEND_REACT,
        MicroserviceTypeEnum.FRONTEND_NEXT,
      ].includes(this.model.type)
    ) {
      await this.prompt(
        "hasCustomGuardian",
        Shortcuts.confirm("Do you want to add a custom GuardianSmart?")
      );
    }

    if (this.model.type === MicroserviceTypeEnum.BACKEND) {
      await this.prompt(
        "hasUsers",
        Shortcuts.confirm(
          "Do you want to integrate a custom user collection?",
          false
        )
      );
    }
  }
}
