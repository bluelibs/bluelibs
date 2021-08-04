import { Routes } from "@bundles/UIAppBundle";
import { useUIComponents, useRouter, useLiveDataOne, use, XRouter } from "@bluelibs/x-ui";
import * as Ant from "antd";
import { ObjectId } from "@bluelibs/ejson";
import { Link } from "react-router-dom";
import { {{ collectionClass }} } from "@bundles/{{ bundleName }}/collections";
import { {{ generateComponentName "viewComponent " }} } from "./{{ generateComponentName "view" }}";
import { {{ entityName }}Viewer } from "../../config/{{ collectionName }}.view.config";
import { features } from "../../config/features";

export function {{ generateComponentName "viewLive" }}(props: { id: string }) {
  const UIComponents = useUIComponents();
  const router = useRouter();
  const collection = use({{ collectionClass }});
  const {data: document, isLoading, error} = useLiveDataOne({{ collectionClass }}, new ObjectId(props.id), {{ entityName }}Viewer.getRequestBody());

  let content;
  if (isLoading) {
    content = <Ant.Space align="center"><Ant.Spin size="large" /></Ant.Space>
  } else {
    if (document === null) {
      content = <Ant.Alert message={"An error occured. The {{ entityName }} may not exist."} type="error" />
    } else {
      content = <{{ generateComponentName "viewComponent" }} document={document} />
    }
  }

  return (
    <UIComponents.AdminLayout>
      <Ant.PageHeader
        title="{{ entityName }} Live Data"
        onBack={() => window.history.back()}
        extra={getHeaderActions(collection, router, props.id)}
      />
      <Ant.Card>{content}</Ant.Card>
    </UIComponents.AdminLayout>
  );
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
    <Link key="view" to={router.path(Routes.{{ generateRouteName "view" }}, {
      params: { id },
    })}>
      <Ant.Button>
        View
      </Ant.Button>
    </Link>
  )

  return actions;
}
