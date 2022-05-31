/** @overridable */
import { notification } from "antd";
import { SmileOutlined } from '@ant-design/icons';
import { XFormElementType, XList, XForm, sheildField, getSheildedRequestBody } from "@bluelibs/x-ui-admin";
import { Routes } from "@bundles/{{ bundleName }}";
import { Service } from "@bluelibs/core";
import { IComponents, XRouter, use, QueryBodyType} from "@bluelibs/x-ui";
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
export class {{ entityName }}List extends XList<{{ entityName }}> {
  build() {
    const { UIComponents, router } = this;
    const { t } = this.i18n;
    {{# if uiCrudSheild }}
    loggedInUser = useGuardian()?.state?.user;
    {{/ if }}
    this.add([
      {{# each (antColumns "list") }}
        {
          id: "{{ id }}",
          {{# if order }}
            order: {{ order }},
          {{/ if }}
          title: t("{{ title }}"),
          key: "{{ title }}",
          dataIndex: {{ dataIndexStr }},
          sorter: true,
          render: (value, model) => {
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

  static getSortMap() {
    return {
      {{# each (antColumns "list") }}
        {{# if relational }}
          "{{ id }}": "{{ id }}.{{ remoteField }}",
        {{/ if }}
      {{/ each }}
    }
  }

  static getRequestBody(): QueryBodyType<{{ entityName }}> {
    {{# if uiCrudSheild }}
    return getSheildedRequestBody(loggedInUser, {{ generateRequestBodyAsString "list" }}, {{ entityName }}SecurityConfig);
    {{ else }}
    return {{ generateRequestBodyAsString "list" }}
    {{/ if }}
  }
}
