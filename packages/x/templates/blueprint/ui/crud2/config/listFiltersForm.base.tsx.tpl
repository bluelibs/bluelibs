/** @overridable */
import { notification } from "antd";
import { XFormElementType, XList, XForm, sheildField } from "@bluelibs/x-ui-admin";
import { Service } from "@bluelibs/core";
import { IComponents, XRouter, use } from "@bluelibs/x-ui";
import * as Ant from "antd";
import {
  {{ entityName }},
  {{# each collectionClassNamesOfInterest }}
    {{ this }},
  {{/ each }}
} from "@bundles/{{ bundleName }}/collections";
{{# if uiCrudSheild }}
import { useGuardian } from "@bluelibs/x-ui-guardian-bundle";
import { {{ entityName }}SecurityConfig } from "./{{ entityName }}.crud.sheild";
let loggedInUser;
{{/ if }}

@Service({ transient: true })
export class {{ entityName }}ListFiltersForm extends XForm {
  build() {
    const { UIComponents } = this;
    const { t } = this.i18n;
    {{# if uiCrudSheild }}
    loggedInUser = useGuardian()?.state?.user;
    {{/ if }}
    this.add([
      {{# each (antColumns "listFilters") }}
        {{> formXElementForFiltering }}
      {{/ each }}
    ]
    {{# if uiCrudSheild }}
    .filter((field) => sheildField(loggedInUser, "filters", field.id, {{ entityName }}SecurityConfig))
    .map((field)=>field.nest?{...field,nest:field.nest.filter((field) => sheildField(loggedInUser, "filters", field.id, {{ entityName }}SecurityConfig))}:field)
    {{/ if }}
    )
  }
}
