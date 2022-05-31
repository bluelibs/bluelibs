/** @overridable */
import { XRouter, use, IComponents, QueryBodyType } from "@bluelibs/x-ui";
import { XForm, sheildField, getSheildedRequestBody } from "@bluelibs/x-ui-admin";
import { Service, Inject } from "@bluelibs/core";
import { SmileOutlined } from '@ant-design/icons';
import { Routes } from "@bundles/{{ bundleName }}";
import * as Ant from "antd";
{{# if typesToImport.edit }}
import { {{ typesToImport.edit }} } from "@root/api.types";
{{/ if }}
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
export class {{ entityName }}EditForm extends XForm {
  @Inject(() => {{ collectionClass }})
  collection: {{ collectionClass }};
  {{# if uiCrudSheild }}
    loggedInUser = useGuardian()?.state?.user;
    {{/ if }}
  build() {
    const { UIComponents } = this;
    const { t } = this.i18n;

    this.add([
      {{# each (antColumns "edit") }}
        {{> formXElement }}
      {{/ each }}
    ]
    {{# if uiCrudSheild }}
    .filter((field) => sheildField(loggedInUser, "edit", field.id, {{ entityName }}SecurityConfig))
    .map((field)=>field.nest?{...field,nest:field.nest.filter((field) => sheildField(loggedInUser, "edit", field.id, {{ entityName }}SecurityConfig))}:field)
    {{/ if }}
    )
  }

  static getRequestBody(): QueryBodyType<{{ entityName }}> {
    {{# if uiCrudSheild }}
    return getSheildedRequestBody(loggedInUser, {{ generateRequestBodyAsString "edit" }}, {{ entityName }}SecurityConfig);
    {{ else }}
    return {{ generateRequestBodyAsString "edit" }}
    {{/ if }}
    
  }

  onSubmit(_id, values: Partial<{{ entityName }}>): Promise<void> {
    const { t } = this.i18n;

    return this.collection.updateOne(_id, { $set: values }, {refetchBody:{_id: 1}}).then(({ _id }) => {
      Ant.notification.success({
        message: t('generics.success'),
        description: t('management.{{ generateI18NName }}.edit_confirmation'),
        icon: <SmileOutlined />,
      });
    }).catch(err => {
      Ant.notification.warn({
        message: t('generics.error'),
        description:
          t('generics.error_message'),
      });
    });
  }
}