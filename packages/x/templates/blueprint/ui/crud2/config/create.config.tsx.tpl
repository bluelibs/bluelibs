import { Service } from "@bluelibs/core";
import { {{ entityName }}CreateForm as Base{{ entityName }}CreateForm } from "./{{ entityName }}CreateForm.base";

@Service({ transient: true })
export class {{ entityName }}CreateForm extends Base{{ entityName }}CreateForm {
  build() {
    super.build();

    // Perform additional modifications such as updating rendering functions, labels, description
  }
}
