import * as _ from "lodash";
import { YupClassFieldMap } from "../utils/ModelUtils";

export class ValidatorModel {
  bundleName: string;
  validatorName: string;
  yupValidationType: string;

  get validatorNameUpper() {
    return _.upperFirst(this.validatorName);
  }

  get validatorConfigInterfaceName() {
    return _.upperFirst(this.validatorName) + "Validator";
  }

  get yupSchemaClassName() {
    return YupClassFieldMap[this.yupValidationType];
  }

  get validatorClassName() {
    return _.upperFirst(this.validatorName) + "Validator";
  }
}
