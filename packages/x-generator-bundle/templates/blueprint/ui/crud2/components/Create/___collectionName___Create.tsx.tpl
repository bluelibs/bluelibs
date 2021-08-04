import { Routes } from "@bundles/{{ bundleName }}";
import { useUIComponents, useRouter, use } from "@bluelibs/x-ui";
import * as Ant from "antd";
import { {{ entityName}}CreateForm } from "../../config/{{ collectionName }}.create.config";
import {
  {{ entityName }},
  {{ collectionClass }},
} from "@bundles/{{ bundleName }}/collections";

const formLayout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};

const formTailLayout = {
  wrapperCol: { offset: 8, span: 16 },
};

export function {{ generateComponentName "create" }}() {
  const UIComponents = useUIComponents();
  const form = use({{ entityName}}CreateForm, { transient: true });
  form.build();

  return (
    <UIComponents.AdminLayout>
      <Ant.PageHeader
        title="Create {{ entityName }}"
        onBack={() => window.history.back()}
      />
      <Ant.Card>
        <Ant.Form 
          {...formLayout}
          requiredMark="optional"
          onFinish={(document) => form.onSubmit(document)}
        >
          {form.render()}
          <Ant.Form.Item {...formTailLayout}>
            <Ant.Button type="primary" htmlType="submit">
              Submit
            </Ant.Button>
          </Ant.Form.Item>
        </Ant.Form>
      </Ant.Card>
    </UIComponents.AdminLayout>
  )
}
