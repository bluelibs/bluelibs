/** @overridable */
import { XRouter, use, IComponents } from "@bluelibs/x-ui";
import { SmileOutlined } from '@ant-design/icons';
import * as Ant from "antd";
import { XFormElementType, XForm } from "@bluelibs/x-ui-admin";
import { Routes } from "@bundles/{{ bundleName }}";
import { Service, Inject } from "@bluelibs/core";
import { features } from "./features";

import {
  {{ entityName }}, 
  {{# each collectionClassNamesOfInterest }}
    {{ this }},
  {{/ each }}
} from "@bundles/{{ bundleName }}/collections";

@Service({ transient: true })
export class {{ entityName }}CreateForm extends XForm {
  @Inject(() => {{ collectionClass }})
  collection: {{ collectionClass }};

  build() {
    const { UIComponents } = this;
    const { t } = this.i18n;

    this.add([
      {{# each (antColumns "create") }}
        {{> formXElement }}
      {{/ each }}
    ])
  }

  onSubmit(document: Partial<{{ entityName }}>): Promise<void> {
    const { t } = this.i18n;

    return this.collection.insertOne(document).then(({ _id }) => {
      Ant.notification.success({
        message: t('generics.success'),
        description: t('management.{{ generateI18NName }}.create_confirmation'),
        icon: <SmileOutlined />,
      });

      if (features.view) {
        return this.router.go(Routes.{{ generateRouteName "view" }}, {
          params: {
            id: _id,
          },
        });
      }
      if (features.list) {
        return this.router.go(Routes.{{ generateRouteName "list" }});
      }
      if (features.edit) {
        return this.router.go(Routes.{{ generateRouteName "edit" }}, {
          params: {
            id: _id,
          },
        });
      }
    }).catch(err => {
      Ant.notification.warn({
        message: t('generics.error'),
        description:
          t('generics.error_message'),
      });
    });
  }
}
