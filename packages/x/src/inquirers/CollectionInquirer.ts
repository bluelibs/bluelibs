import { Inquirer, Shortcuts } from "@bluelibs/terminal-bundle";
import { CreateBundleModel, GenericModel } from "../models";
import { FSUtils } from "../utils/FSUtils";
import { CollectionModel } from "../models/CollectionModel";
import { GenericModelInquirer } from "./GenericModelInquirer";
import * as _ from "lodash";
import { InquiryUtils } from "../utils/InquiryUtils";
import { GenericFieldTypeEnum } from "../models/defs";

export class CollectionInquirer extends Inquirer<CollectionModel> {
  model = new CollectionModel();

  async inquire() {
    await InquiryUtils.inquireAllBundles(this);

    await this.prompt(
      "collectionName",
      Shortcuts.input("Enter the name of your collection (ex: users)", {
        validate(value) {
          return Boolean(value);
        },
      })
    );

    this.model.modelDefinition = new GenericModel(
      _.upperFirst(this.model.collectionName.slice(0, -1))
    );

    const { modelDefinition } = this.model;

    await this.prompt("modelDefinition", {
      inquirer: GenericModelInquirer,
    });

    await this.prompt(
      "createEntity",
      Shortcuts.confirm("Should we add a GraphQL Entity?")
    );

    await this.prompt(
      "isTimestampable",
      Shortcuts.confirm("Add timestampable behavior?", true)
    );

    if (this.model.isTimestampable) {
      modelDefinition.addField({
        name: "createdAt",
        type: GenericFieldTypeEnum.DATE,
        isOptional: false,
      });
      modelDefinition.addField({
        name: "updatedAt",
        type: GenericFieldTypeEnum.DATE,
        isOptional: true,
      });
    }

    await this.prompt(
      "isSoftdeletable",
      Shortcuts.confirm("Add softdeletable behavior?", false)
    );

    if (this.model.isSoftdeletable) {
      modelDefinition.addField({
        name: "deletedAt",
        type: GenericFieldTypeEnum.DATE,
        isOptional: true,
      });
      modelDefinition.addField({
        name: "deletedBy",
        type: GenericFieldTypeEnum.ID,
        isOptional: true,
      });
      modelDefinition.addField({
        name: "isDeleted",
        type: GenericFieldTypeEnum.BOOLEAN,
        isOptional: true,
      });
    }

    await this.prompt(
      "isBlameable",
      Shortcuts.confirm("Add blameable behavior?", true)
    );

    if (this.model.isBlameable) {
      modelDefinition.addField({
        name: "createdBy",
        type: GenericFieldTypeEnum.ID,
        isOptional: false,
      });
      modelDefinition.addField({
        name: "updatedBy",
        type: GenericFieldTypeEnum.ID,
        isOptional: true,
      });
    }

    await this.prompt(
      "validateAgainstModel",
      Shortcuts.confirm(
        "Should we attach validatable behavior to our model?",
        false
      )
    );

    modelDefinition.ensureIdField();

    this.model.entityDefinition = GenericModel.clone(modelDefinition);
  }
}
