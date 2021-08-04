import { Inquirer, Shortcuts } from "@bluelibs/terminal-bundle";
import { CreateBundleModel, GenericModel } from "../models";
import { FSUtils } from "../utils/FSUtils";
import { CollectionModel } from "../models/CollectionModel";
import { GenericModelInquirer } from "./GenericModelInquirer";
import * as _ from "lodash";
import { InquiryUtils } from "../utils/InquiryUtils";
import { ListenerModel } from "../models/ListenerModel";
import { XElementType } from "../utils/XElements";

export class ListenerInquirer extends Inquirer<ListenerModel> {
  model = new ListenerModel();

  async inquire() {
    await InquiryUtils.inquireAllBundles(this);

    await this.prompt(
      "listenerName",
      Shortcuts.input("Enter the name of your listener (eg: Post)", {
        validate(value) {
          return Boolean(value);
        },
      })
    );

    await this.prompt(
      "collectionEvents",
      Shortcuts.confirm(
        "Would you like to listen to some collection events?",
        false
      )
    );

    if (this.model.collectionEvents) {
      await InquiryUtils.inquireXElement(
        this,
        "collectionElement",
        XElementType.COLLECTION
      );
    }
  }
}
