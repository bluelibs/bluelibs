import { Inquirer, Shortcuts } from "@bluelibs/terminal-bundle";
import { CreateBundleModel, GenericModel } from "../models";
import { FSUtils } from "../utils/FSUtils";
import { CollectionModel } from "../models/CollectionModel";
import { GenericModelInquirer } from "./GenericModelInquirer";
import * as _ from "lodash";
import { ContainerInstance, Inject } from "@bluelibs/core";
import { InquiryUtils } from "../utils/InquiryUtils";
import { GraphQLInputModel } from "../models/GraphQLInputModel";
import { ModelRaceEnum, GenericFieldTypeEnum } from "../models/defs";
import { GraphQLCollectionMutationOperation } from "../models/GraphQLMutationModel";
import { XElements, XElementType } from "../utils/XElements";
import {
  GraphQLMutationModel,
  MutationDelegateType,
} from "../models/GraphQLMutationModel";

export class GraphQLMutationInquirer extends Inquirer<GraphQLMutationModel> {
  @Inject(() => ContainerInstance)
  protected container: ContainerInstance;

  model = new GraphQLMutationModel();

  async inquire() {
    const microserviceDir = FSUtils.getNearest("microservice");
    await InquiryUtils.inquireAllBundles(this);

    await this.prompt(
      "mutationName",
      Shortcuts.input("What is the mutation name (eg: updateUser)")
    );

    await this.prompt(
      "returnType",
      Shortcuts.autocomplete(
        "What is the return type?",
        [
          "void",
          ...Object.values(GenericFieldTypeEnum),
          // List of all the found entities, just by string
          ...XElements.findElements(
            XElementType.GRAPHQL_ENTITY,
            microserviceDir
          ).map((element) => {
            return element.identityName;
          }),
        ],
        {},
        { allowCustomValue: true }
      )
    );

    if (this.model.returnType !== "void") {
      await this.prompt(
        "returnTypeIsArray",
        Shortcuts.confirm("Is the return type an array?", false)
      );
    }

    await this.prompt(
      "checkLoggedIn",
      Shortcuts.confirm("Allow only logged in users to use this?", true)
    );

    await this.prompt(
      "permissionCheck",
      Shortcuts.confirm("Require certain security permissions?", false)
    );

    await this.prompt(
      "delegateType",
      Shortcuts.autocomplete(
        "Where does this mutation delegate to?",
        Object.values(MutationDelegateType),
        {},
        {
          defaultValue: true,
        }
      )
    );

    if (this.model.delegateType === MutationDelegateType.COLLECTION_ACTION) {
      await this.prompt(
        "collectionOperation",
        Shortcuts.autocomplete(
          "What kind of operation would be performed on the collection?",
          Object.values(GraphQLCollectionMutationOperation)
        )
      );

      await InquiryUtils.inquireXElement(
        this,
        "collectionElement",
        XElementType.COLLECTION
      );
    }

    if (this.model.delegateType === MutationDelegateType.SERVICE) {
      await InquiryUtils.inquireXElement(
        this,
        "serviceElement",
        XElementType.SERVICE
      );

      await this.prompt(
        "serviceMethodName",
        Shortcuts.input("Enter the method name you want to delegate to: ", {
          validate: (v) => Boolean(v),
        })
      );
    }

    // Input

    await this.prompt(
      "hasInput",
      Shortcuts.confirm("Does this mutation has arguments/inputs ?", true)
    );

    if (this.model.hasInput) {
      await this.prompt(
        "inputAlreadyExists",
        Shortcuts.confirm("Is the input already defined?", false)
      );

      if (this.model.inputAlreadyExists) {
        await InquiryUtils.inquireXElement(
          this,
          "inputElement",
          XElementType.GRAPHQL_INPUT_MODEL
        );
      } else {
        const inputInquirer = this.container.get(GenericModelInquirer);
        this.model.inputModel.yupValidation = true;
        this.model.inputModel.name = _.upperFirst(this.model.mutationName);
        inputInquirer.model = this.model.inputModel;
        await inputInquirer.inquire();
      }
    }
  }
}
