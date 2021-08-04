import * as _ from "lodash";
import { GenericModel } from ".";
import { ModelRaceEnum } from "./defs";

export class ExceptionModel {
  bundleName: string;
  exceptionName: string;

  hasInterfaceDefined: boolean;
  interfaceDefinition: GenericModel = new GenericModel(
    "",
    ModelRaceEnum.INTERFACE
  );

  get exceptionClass() {
    const propperForm = _.upperFirst(_.camelCase(this.exceptionName));

    return propperForm + "Exception";
  }

  get exceptionInterfaceName() {
    if (this.hasInterfaceDefined) {
      return this.interfaceDefinition.name;
    } else {
      return "any";
    }
  }
}
