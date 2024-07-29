import { Link } from "react-router-dom";
import * as Ant from "antd";
import { ObjectId } from "@bluelibs/ejson";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Routes } from "@bundles/{{ bundleName }}";
import { useUIComponents, useRouter, use, useDataOne, useTranslate } from "@bluelibs/x-ui";
import { {{ entityName}}EditForm } from "../../config/{{ entityName }}EditForm";
import { features } from "../../config/features";
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

export function {{ generateComponentName "edit" }}(props: { id: string }) {
  const UIComponents = useUIComponents();
  const t = useTranslate();
  const form = use({{ entityName}}EditForm, { transient: true });
  const router = useRouter();
  const collection = use({{ collectionClass }});

  const {data: document, isLoading, error} = useDataOne({{ collectionClass }}, new ObjectId(props.id), {{ entityName}}EditForm.getRequestBody());

  form.build();

  return (
    <UIComponents.AdminLayout>
      <Ant.PageHeader
        title={t('management.{{ generateI18NName }}.edit.header')}
        onBack={() => window.history.back()}
        extra={features.view ? [
          <Link key="view" to={router.path(Routes.{{ generateRouteName "view" }}, {
            params: { id: props.id },
          })}>
            <Ant.Button>
              {t('generics.view')}
            </Ant.Button>
          </Link>
          ,
        ] : []}
      />
      <Ant.Card>
        {isLoading && <Ant.Space align="center"><Ant.Spin size="large" /></Ant.Space>}
        {!isLoading && (error || !document) && 
          <Ant.Alert message={error.toString() || t('generics.error_message')} type="error" />
        }
        {!isLoading && !error && (
          <Ant.Form 
            {...formLayout}
            requiredMark="optional"
            initialValues={ document as {{ entityName }} }
            onFinish={(document) => form.onSubmit(props.id, document)}
          >
            {form.render()}
            <Ant.Form.Item {...formTailLayout}>
              <Ant.Button type="primary" htmlType="submit">
                {t('generics.submit')}
              </Ant.Button>
            </Ant.Form.Item>
          </Ant.Form>
        )}
      </Ant.Card>
    </UIComponents.AdminLayout>
  )
}
