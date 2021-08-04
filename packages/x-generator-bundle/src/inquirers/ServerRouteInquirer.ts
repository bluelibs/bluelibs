import { Inquirer, Shortcuts } from "@bluelibs/terminal-bundle";
import { CreateBundleModel, GenericModel } from "../models";
import { FSUtils } from "../utils/FSUtils";
import { CollectionModel } from "../models/CollectionModel";
import { GenericModelInquirer } from "./GenericModelInquirer";
import * as _ from "lodash";
import { InquiryUtils } from "../utils/InquiryUtils";
import { ServerRouteModel } from "../models/ServerRouteModel";

export class ServerRouteInquirer extends Inquirer<ServerRouteModel> {
  model = new ServerRouteModel();

  async inquire() {
    await InquiryUtils.inquireAllBundles(this);

    await this.prompt(
      "path",
      Shortcuts.input("Enter the path (eg: /payments/process)", {
        validate(value) {
          return Boolean(value);
        },
      })
    );

    let name = this.model.path
      .replace(/\//g, " ")
      .split(" ")
      .filter((element) => !element.startsWith(":"))
      .join(" ");

    this.model.name = _.camelCase(name);
    await this.prompt(
      "name",
      Shortcuts.input("What is the name of your route?", {
        validate(value) {
          return Boolean(value);
        },
      })
    );

    await this.prompt(
      "type",
      Shortcuts.autocomplete("What type of requests to receive?", [
        "all",
        "post",
        "get",
        "put",
      ])
    );
  }
}
