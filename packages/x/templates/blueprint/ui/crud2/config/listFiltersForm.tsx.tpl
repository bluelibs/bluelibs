import { Service } from "@bluelibs/core";
import { {{ entityName }}ListFiltersForm as Base{{ entityName }}ListFiltersForm } from "./{{ entityName }}ListFiltersForm.base";

@Service({ transient: true })
export class {{ entityName }}ListFiltersForm extends Base{{ entityName }}ListFiltersForm {
  build() {
    super.build();

    // Perform additional modifications such as updating rendering functions, labels, description
  }
}
