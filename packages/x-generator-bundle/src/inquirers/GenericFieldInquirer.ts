import {
  Inquirer,
  Shortcuts,
  ExitInquiryException,
  IAutocompleteOption,
} from "@bluelibs/terminal-bundle";
import { CreateBundleModel } from "../models";
import { FSUtils } from "../utils/FSUtils";
import { GenericModel } from "../models/GenericModel";
import {
  IGenericField,
  GenericFieldTypeEnum,
  IFieldBaseSignature,
} from "../models/defs";

export class GenericFieldInquirer extends Inquirer<IGenericField> {
  allOptions = this.getFieldAutocompleteOptions();

  model: IGenericField = {
    name: "",
    type: GenericFieldTypeEnum.STRING,
    isOptional: true,
    isMany: false,
  };

  async inquire() {
    await this.prompt("name", Shortcuts.input("What is field's name?"));

    if (!this.model.name) {
      await this.prompt(
        "name",
        Shortcuts.input("What is field's name? (leave blank to exit)")
      );
      if (!this.model.name) {
        throw new ExitInquiryException();
      }
    }

    let selection: IFieldBaseSignature = await this.prompter.prompt(
      Shortcuts.autocomplete(
        "What is field's type?",
        this.allOptions,
        {},
        {
          allowCustomValue: true,
        }
      )
    );

    if (typeof selection === "string") {
      selection = this.extractSelection(selection);
    }

    this.model.type = selection.type;
    this.model.isOptional = selection.isOptional;
    this.model.isMany = selection.isMany;

    if (this.model.type === GenericFieldTypeEnum.MODEL) {
      // TODO: somehow feed additional models to the generic field inquirer?
    }

    if (this.model.type === GenericFieldTypeEnum.ENUM) {
      await this.prompt(
        "enumCSVValues",
        Shortcuts.input("Enter the labels of your enum, comma separated:")
      );
      // TODO: allow him to configure ENUM states
    }
  }

  extractSelection(selection: string): IFieldBaseSignature {
    const isOptional = selection.indexOf("!") === -1;
    const isMany = selection.indexOf("[") >= 0;
    selection = selection.replace(/\[/, "").replace(/\]/, "").replace(/\!/, "");

    return {
      type: selection,
      isOptional,
      isMany,
    };
  }

  getFieldAutocompleteOptions(): IAutocompleteOption[] {
    const options: IAutocompleteOption[] = [];
    Object.values(GenericFieldTypeEnum).forEach((fieldType) => {
      options.push({
        id: fieldType,
        value: {
          type: fieldType,
          isOptional: true,
          isMany: false,
        },
      });
      options.push({
        id: `${fieldType}!`,
        value: {
          type: fieldType,
          isOptional: false,
          isMany: false,
        },
      });
      options.push({
        id: `[${fieldType}]!`,
        value: {
          type: fieldType,
          isOptional: false,
          isMany: true,
        },
      });
      options.push({
        id: `[${fieldType}]`,
        value: {
          type: fieldType,
          isOptional: true,
          isMany: true,
        },
      });
    });

    return options;
  }
}
