/** @overridable */
import { XRouter, use, IComponents, QueryBodyType } from "@bluelibs/x-ui";
import { XForm } from "@bluelibs/x-ui-admin";
import { Service, Inject } from "@bluelibs/core";
import { SmileOutlined } from '@ant-design/icons';
import { Routes } from "@bundles/{{ bundleName }}";
import * as Ant from "antd";
import {
  {{ entityName }},
  {{# each collectionClassNamesOfInterest }}
    {{ this }},
  {{/ each }}
} from "@bundles/{{ bundleName }}/collections";

@Service({ transient: true })
export class {{ entityName }}EditForm extends XForm {
  @Inject(() => {{ collectionClass }})
  collection: {{ collectionClass }};

  build() {
    const { UIComponents } = this;

    this.add([
      {{# each (antColumns "edit") }}
        {{> formXElement }}
      {{/ each }}
    ])
  }

  static getRequestBody(): QueryBodyType<{{ entityName }}> {
    return {{ generateRequestBodyAsString "edit" }}
  }

  onSubmit(_id, values: Partial<{{ entityName }}>): Promise<void> {
    return this.collection.updateOne(_id, { $set: values }).then(({ _id }) => {
      Ant.notification.success({
        message: 'Success',
        description:
          'You have successfully edited the {{ entityName }}.',
        icon: <SmileOutlined />,
      });
    }).catch(err => {
      Ant.notification.warn({
        message: 'Failure',
        description:
          'There was an error while trying to edit the {{ entityName }}',
      });
    });
  }
}