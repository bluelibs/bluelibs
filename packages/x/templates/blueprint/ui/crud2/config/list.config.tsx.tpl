/** @overridable */
import { notification } from "antd";
import { SmileOutlined } from '@ant-design/icons';
import { XFormElementType, XList, XForm } from "@bluelibs/x-ui-admin";
import { Routes } from "@bundles/{{ bundleName }}";
import { Service } from "@bluelibs/core";
import { IComponents, XRouter, use, QueryBodyType } from "@bluelibs/x-ui";
import * as Ant from "antd";
import {
  {{ entityName }},
  {{# each collectionClassNamesOfInterest }}
    {{ this }},
  {{/ each }}
} from "@bundles/{{ bundleName }}/collections";

@Service({ transient: true })
export class {{ entityName }}List extends XList<{{ entityName }}> {
  build() {
    const { UIComponents, router } = this;

    this.add([
      {{# each (antColumns "list") }}
        {
          id: "{{ id }}",
          {{# if order }}
            order: {{ order }},
          {{/ if }}
          title: "{{ title }}",
          key: "{{ title }}",
          dataIndex: {{ dataIndexStr }},
          sorter: true,
          render: (value, model) => {
            {{> listItemRendition }}
          },
        },
      {{/ each }}
    ]);
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
    return {{ generateRequestBodyAsString "list" }}
  }
}

@Service({ transient: true })
export class {{ entityName }}ListFiltersForm extends XForm {
  build() {
    const { UIComponents } = this;

    this.add([
      {{# each (antColumns "listFilters") }}
        {{> formXElementForFiltering }}
      {{/ each }}
    ])
  }
}
