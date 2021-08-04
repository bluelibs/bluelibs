import "@bluelibs/validator-bundle";
import { {{ validatorConfigInterfaceName }} } from './{{ validatorClassName }}';

/**
 * We need to be able to have autocompletion and extend the "yup" from within our validator.
 */
declare module "@bluelibs/validator-bundle" {
  // eslint-disable-next-line
  export module yup {
    export interface {{ yupSchemaClassName }} {
      {{ validatorName }}(config?: {{ validatorConfigInterfaceName }}): {{ yupSchemaClassName }}
    }
  }
}
