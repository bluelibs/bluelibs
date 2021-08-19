/** @overridable */
import { notification } from "antd";
import { XFormElementType, XList, XForm } from "@bluelibs/x-ui-admin";
import { Service } from "@bluelibs/core";
import { IComponents, XRouter, use } from "@bluelibs/x-ui";
import * as Ant from "antd";
import {
  {{ entityName }},
  {{# each collectionClassNamesOfInterest }}
    {{ this }},
  {{/ each }}
} from "@bundles/{{ bundleName }}/collections";

@Service({ transient: true })
export class {{ entityName }}ListFiltersForm extends XForm {
  build() {
    const { UIComponents } = this;
    const { t } = this.i18n;

    this.add([
      {{# each (antColumns "listFilters") }}
        {{> formXElementForFiltering }}
      {{/ each }}
    ])
  }
}
