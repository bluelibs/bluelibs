import { Link } from "react-router-dom";
import * as Ant from "antd";
import { Routes } from "@bundles/UIAppBundle";
import { useUIComponents, useRouter, useDataOne, use, XRouter, useTranslate } from "@bluelibs/x-ui";
import { ObjectId } from "@bluelibs/ejson";
import { {{ entityName }}, {{ collectionClass }} } from "@bundles/{{ bundleName }}/collections";
import { {{ entityName }}Viewer } from "../../config/{{ entityName }}Viewer";
import { features } from "../../config/features";

export function {{ generateComponentName "view" }}(props: { id: string }) {
  const UIComponents = useUIComponents();
  const router = useRouter();
  const t = useTranslate();
  const collection = use({{ collectionClass }});

  // If you want to benefit of live data features use useLiveData()
  const {data: document, isLoading, error} = useDataOne({{ collectionClass }}, new ObjectId(props.id), {{ entityName }}Viewer.getRequestBody());

  let content;
  if (isLoading) {
    content = <Ant.Space align="center"><Ant.Spin size="large" /></Ant.Space>
  } else {
    if (error || document === null) {
      content = <Ant.Alerst message={error.toString() || t('generics.error_message')} type="error" />
    } else {
      content = <{{ generateComponentName "viewComponent" }} document={document} />
    }
  }

  return (
    <UIComponents.AdminLayout>
      <Ant.PageHeader
        title={t('management.{{ generateI18NName }}.view.header')}
        onBack={() => window.history.back()}
        extra={getHeaderActions(collection, router, props.id)}
      />
      <Ant.Card>{content}</Ant.Card>
    </UIComponents.AdminLayout>
  );
}

export function {{ generateComponentName "viewComponent" }}(props: { document: Partial<{{ entityName }}> }) {
  const document = props.document;

  const viewer = use({{ entityName }}Viewer, { transient: true });
  viewer.setDocument(document);
  viewer.build();

  return (
    <Ant.Descriptions>
      {viewer.rest().map(item => {
        return (
          <Ant.Descriptions.Item label={item.label} key={item.id}>
            {viewer.render(item)}
          </Ant.Descriptions.Item>
        )
      })}
    </Ant.Descriptions>
  )
}

export function getHeaderActions(collection: {{ collectionClass }}, router: XRouter, id: string) {
  const actions = [];
  const t = useTranslate();

  if (features.edit) {
    actions.push(
      <Link key="edit" to={router.path(Routes.{{ generateRouteName "edit" }}, {
        params: { id },
      })}>
        <Ant.Button>
          {t('generics.edit')}
        </Ant.Button>
      </Link>
    )
  }
  if (features.delete) {
    actions.push(
      <Ant.Popconfirm 
        key="delete"
        title="Are you sure you want to delete this {{ entityName }}?" 
        onConfirm={() => {
          collection.deleteOne(id).then(() => {
            router.go(Routes.{{ generateRouteName "list" }});
            Ant.notification.success({
              message: "Success",
              description: "You have deleted the {{ entityName }}",
            })
          })
        }}
      >
      <Ant.Button
        danger
      >
        {t('generics.delete')}
      </Ant.Button>
    </Ant.Popconfirm>
    )
  }

  const viewRoutePath = router.path(Routes.{{ generateRouteName "view" }}, {
    params: { id },
  });

  return actions;
}