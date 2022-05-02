import { Routes } from "@bundles/{{ bundleName }}";
import { useUIComponents, useRouter, use, useTranslate } from "@bluelibs/x-ui";
import * as Ant from "antd";
import { {{ entityName}}CreateForm } from "../../config/{{ entityName }}CreateForm";
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
  const t = useTranslate();
  const form = use({{ entityName}}CreateForm, { transient: true });
  form.build();

  return (
    <UIComponents.AdminLayout>
      <Ant.PageHeader
        title={t('management.{{ generateI18NName }}.create.header')}
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
              {t('generics.submit')}
            </Ant.Button>
          </Ant.Form.Item>
        </Ant.Form>
      </Ant.Card>
    </UIComponents.AdminLayout>
  )
}

export default {{ generateComponentName "create" }};