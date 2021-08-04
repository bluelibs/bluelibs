import { Inquirer, Shortcuts } from "@bluelibs/terminal-bundle";
import { CreateBundleModel, GenericModel } from "../models";
import { FSUtils } from "../utils/FSUtils";
import { CollectionModel } from "../models/CollectionModel";
import { GenericModelInquirer } from "./GenericModelInquirer";
import * as _ from "lodash";
import { InquiryUtils } from "../utils/InquiryUtils";
import { EventModel } from "../models/EventModel";

export class EventInquirer extends Inquirer<EventModel> {
  model = new EventModel();

  async inquire() {
    await InquiryUtils.inquireAllBundles(this);

    await this.prompt(
      "eventName",
      Shortcuts.input("Enter the name of your event (eg: PostPublished)", {
        validate(value) {
          return Boolean(value);
        },
      })
    );

    await this.prompt(
      "hasInterfaceDefined",
      Shortcuts.confirm(
        "Do you want to define a data interface for this event?",
        true
      )
    );

    const { hasInterfaceDefined, interfaceDefinition, eventClass } = this.model;
    if (hasInterfaceDefined) {
      interfaceDefinition.name = `I${eventClass}Data`;

      await this.prompt("interfaceDefinition", {
        inquirer: GenericModelInquirer,
        default: this.model.interfaceDefinition,
      });
    }
  }
}
