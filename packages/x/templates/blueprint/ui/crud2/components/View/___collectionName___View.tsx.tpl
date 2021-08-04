import { Link } from "react-router-dom";
import * as Ant from "antd";
import { Routes } from "@bundles/UIAppBundle";
import { useUIComponents, useRouter, useDataOne, use, XRouter } from "@bluelibs/x-ui";
import { ObjectId } from "@bluelibs/ejson";
import { {{ entityName }}, {{ collectionClass }} } from "@bundles/{{ bundleName }}/collections";
import { {{ entityName }}Viewer } from "../../config/{{ collectionName }}.view.config";
import { features } from "../../config/features";

export function {{ generateComponentName "view" }}(props: { id: string }) {
  const UIComponents = useUIComponents();
  const router = useRouter();
  const collection = use({{ collectionClass }});
  const {data: document, isLoading, error} = useDataOne({{ collectionClass }}, new ObjectId(props.id), {{ entityName }}Viewer.getRequestBody());

  let content;
  if (isLoading) {
    content = <Ant.Space align="center"><Ant.Spin size="large" /></Ant.Space>
  } else {
    if (error || document === null) {
      content = <Ant.Alert message={error || "An error occured. The {{ entityName }} may not exist."} type="error" />
    } else {
      content = <{{ generateComponentName "viewComponent" }} document={document} />
    }
  }

  return (
    <UIComponents.AdminLayout>
      <Ant.PageHeader
        title="{{ entityName }}"
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
          <Ant.Descriptions.Item label={item.label}>
            {viewer.render(item)}
          </Ant.Descriptions.Item>
        )
      })}
    </Ant.Descriptions>
  )
}

function getHeaderActions(collection: {{ collectionClass }}, router: XRouter, id: string) {
  const actions = [];

  if (features.edit) {
    actions.push(
      <Link key="edit" to={router.path(Routes.{{ generateRouteName "edit" }}, {
        params: { id },
      })}>
        <Ant.Button>
          Edit
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
        Delete
      </Ant.Button>
    </Ant.Popconfirm>
    )
  }

  actions.push(
    <Link key="live" to={router.path(Routes.{{ generateRouteName "viewLive" }}, {
      params: { id },
    })}>
      <Ant.Button>
        Live Data
      </Ant.Button>
    </Link>
  )

  return actions;
}