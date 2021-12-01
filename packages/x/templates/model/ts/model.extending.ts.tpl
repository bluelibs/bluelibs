
{{# unless isInputMode }}
  export * from "./{{ localBaseName }}";
{{/ unless }}
{{# if yupValidation }}
  import { Schema, Is, a, an } from "@bluelibs/validator-bundle";
{{/ if }}
import { {{ modelClass }} as Base{{ modelClass }} } from "./{{ localBaseName }}";
{{# unless isInputMode }}
  {{# each localModels }}
    export { {{ name }} } from "./{{ @root.localBaseName }}"
  {{/ each }}
  {{# each enums }}
    export { {{ className }} } from "./enums/{{ className }}.enum";
  {{/ each }}
{{/ unless }}

{{# if yupValidation }}@Schema(){{/ if }}
export class {{ modelClass }} extends Base{{ modelClass }} {
  // You can extend the base here
}