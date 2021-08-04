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
import {
  GraphQLQueryModel,
  QueryDelegateType,
} from "../models/GraphQLQueryModel";

export class GraphQLQueryInquirer extends Inquirer<GraphQLQueryModel> {
  @Inject(() => ContainerInstance)
  protected container: ContainerInstance;

  model = new GraphQLQueryModel();

  async inquire() {
    const microserviceDir = FSUtils.getNearest("microservice");
    await InquiryUtils.inquireAllBundles(this);

    await this.prompt(
      "queryName",
      Shortcuts.input("What is the query name (eg: findUsers)")
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
        "Where does this query delegate to?",
        Object.values(QueryDelegateType),
        {},
        {
          defaultValue: QueryDelegateType.NOVA,
        }
      )
    );

    if (this.model.isNova()) {
      await InquiryUtils.inquireXElement(
        this,
        "collectionElement",
        XElementType.COLLECTION
      );
    }

    if (this.model.delegateType === QueryDelegateType.SERVICE) {
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
    if (this.model.isNova()) {
      // We finished here we set the input to: "QueryInput"
      // That's life, you can customise later?
      return;
    }

    await this.prompt(
      "hasInput",
      Shortcuts.confirm("Does this query has arguments/inputs ?", true)
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
        inputInquirer.model = this.model.inputModel;
        inputInquirer.model.name = _.upperFirst(this.model.queryName);
        await inputInquirer.inquire();
      }
    }
  }
}
