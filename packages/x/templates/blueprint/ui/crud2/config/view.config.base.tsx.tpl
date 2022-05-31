/** @overridable */
import { {{ entityName }} } from '@root/api.types';
import { Service } from "@bluelibs/core";
import { QueryBodyType, XRouter, IComponents } from '@bluelibs/x-ui';
import { XViewElementType, XViewer, sheildField, getSheildedRequestBody } from '@bluelibs/x-ui-admin';
import * as Ant from "antd";
import { Routes } from "@bundles/{{ bundleName }}";
{{# if uiCrudSheild }}
import { useGuardian } from "@bluelibs/x-ui-guardian-bundle";
import { {{ entityName }}SecurityConfig } from "./{{ entityName }}.crud.sheild";
let loggedInUser;
{{/ if }}

@Service({ transient: true })
export class {{ entityName }}Viewer extends XViewer {
  build() {
    const { UIComponents, router } = this;
    const { t } = this.i18n;
    {{# if uiCrudSheild }}
    loggedInUser = useGuardian()?.state?.user;
    {{/ if }}

    this.add([
      {{# each (antColumns "view") }}
        {
          id: "{{ id }}",
          label: t("{{ title }}"),
          dataIndex: {{ dataIndexStr }},
          render: (value) => {
            {{> listItemRendition }}
          },
        },
      {{/ each }}
    ]
    {{# if uiCrudSheild }}
    .filter((column) => sheildField(loggedInUser, "find", column.id, {{ entityName }}SecurityConfig))
    {{/ if }}
    );
  }

  static getRequestBody(): QueryBodyType<{{ entityName }}> {
    {{# if uiCrudSheild }}
    return getSheildedRequestBody(loggedInUser, {{ generateRequestBodyAsString "view" }}, {{ entityName }}SecurityConfig);
    {{ else }}
    return {{ generateRequestBodyAsString "view" }}
    {{/ if }}
  }
}