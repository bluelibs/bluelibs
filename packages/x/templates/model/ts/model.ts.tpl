{{# if isBaseExtendMode }}
/** overridable */
{{/ if }}
{{# if yupValidation }}
  import { Schema, Is, a, an } from "@bluelibs/validator-bundle";
{{/ if }}
{{# each remoteModels }}
  {{# if referenceBundle }}
    import { {{ name }} } from "../../../{{ bundle }}/collections";
  {{ else }}
    {{# if absoluteImport }}
      import { {{ name }} } from "{{ absoluteImport }}";
    {{ else }}
      import { {{ name }} } from "../";
    {{/ if }}
  {{/ if }}
{{/ each }}
{{# each enums }}
  import { {{ className }} } from "{{ importFrom }}";
  export { {{ className }} };
{{/ each }}

{{# each localModels }}
  {{# if @root.yupValidation }}@Schema(){{/ if }}
  export class {{ name }} {
    {{ @root.toTypescriptSubmodel this }}
  }
{{/ each }}

{{# if yupValidation }}@Schema(){{/ if }}
export class {{ modelClass }} {
  {{ toTypescript }}
}
