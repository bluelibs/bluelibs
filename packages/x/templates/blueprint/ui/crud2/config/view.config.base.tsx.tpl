/** @overridable */
import { {{ entityName }} } from '@root/api.types';
import { Service } from "@bluelibs/core";
import { QueryBodyType, XRouter, IComponents } from '@bluelibs/x-ui';
import { XViewElementType, XViewer } from '@bluelibs/x-ui-admin';
import * as Ant from "antd";
import { Routes } from "@bundles/{{ bundleName }}";

@Service({ transient: true })
export class {{ entityName }}Viewer extends XViewer {
  build() {
    const { UIComponents, router } = this;
    const { t } = this.i18n;

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
    ]);
  }

  static getRequestBody(): QueryBodyType<{{ entityName }}> {
    return {{ generateRequestBodyAsString "view" }};
  }
}