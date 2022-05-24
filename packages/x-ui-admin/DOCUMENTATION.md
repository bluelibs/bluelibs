## Purpose

This is the place where you configure your enterprise level applications Administration interface. This bundle makes use of `@bluelibs/x-ui`, so it is best if you familiarise yourself with it first.

This bundle uses `Ant Design` to leverage its Admin interface. Allowing you to focus on creating Menu Routes that can be role-dependent. This enables `Wordpress-like` functionality where external bundles that you just add to your `Kernel` extend the menu nicely.

## Install

```bash
npm i -S @bluelibs/x-ui-admin antd @ant-design/icons
```

```tsx
kernel.addBundles([new XUIBundle(), new XUIAdminBundle()]);
```

## UI

Let's explore a bit about the structure, by creating our first layout:

```tsx title="components/Layout.tsx"
import { useUIComponents } from "@bluelibs/x-ui";

// This is to illustrate how you can have a custom layout:
function Dashboard() {
  const Components = useUIComponents();

  return (
    <Components.AdminLayout content={}>
      <h1>Hello world!</h1>
    </Components.AdminLayout>
  );
}
```

Now we need to create a route, and because we don't rely on strings for routing, we should read them from a separate place, and register them in our bundle:

```tsx title="routes.ts"
import { IRoute } from "@bluelibs/x-ui";

export const DASHBOARD = {
  path: "/dashboard",
  component: Dashboard,
  // optionally require certain roles that you can define in a Roles enum
  roles: [Roles.ADMIN],

  // You have the ability to create menu items from the route directly
  menu: {
    icon: RightOutlined, // Use any from: https://ant.design/components/icon/
    key: "DASHBOARD", // a unique name
    label: "Dashboard",
    order: 0, // If you want it to hold priority. The menus will be sorted by order, otherwise, by the order they have been added into the menu
  },
};
```

This is done only once, but don't forget to load your routes:

```ts
// In your bundle:
import * as Routes from "./routes";

export class UIAppBundle extends Bundle {
  async function init() {
    const router = this.container.get(XRouter);

    router.add(Routes);
  }
}
```

If you want to nest menu items you have to specify `inject` property:

```tsx
export const DASHBOARD = {
  path: "/dashboard",
  component: Dashboard,
  // You have the ability to create menu items from the route directly
  menu: {
    key: "DASHBOARD", // a unique name
    label: "Dashboard",
  },
};

export const DASHBOARD_SPECIFICS = {
  path: "/dashboard",
  component: Dashboard,
  menu: {
    key: "SPECIFICS", // a unique name
    inject: "DASHBOARD", // You can also inject another one under "DASHBOARD.SPECIFICS"
  },
};
```

:::note
You can apply dynamic loading to your admin dashboard routes by adding boolean `uiDynamicLoading: true` to your app model in blueprint, or to a specific collection if you want to target one collection
:::

## Consumers

In order to have a mechanism of using forms in a nice descriptive manner, we created a `Consumer` class which allows us to construct it with a set of data and then consume elements one by one, and ability to display the rest of unconsumed elements.

The API is simple and straight forward:

```ts
import { Consumer } from "@bluelibs/x-ui-admin";

const elements = [
  {
    id: "1",
    name: 123,
  },
  {
    id: "2",
    name: 124,
  },
  {
    id: "3",
    name: 125,
  },
];

const consumer = new Consumer(elements);

// Check if we finished consumption, ofcourse, it's false
consumer.isConsumed();

const e1 = consumer.consume("1"); // this is the "1" element

consumer.isElementConsumed("1"); // true
consumer.isElementConsumed("2"); // false
consumer.isConsumed(); // false

consumer.consume("4"); // throws error: Consumer.Errors.ElementNotFound

const rest = consumer.rest(); // returns an array "2" and "3" elements
consumer.isConsumed(); // true
consumer.isElementConsumed("2"); // true
consumer.isElementConsumed("3"); // true

consumer.consume("1"); // throws error: Consumer.Errors.AlreadyConsumed
```

You can also benefit of autocompletion like: `new Consumer<MyType>()` as long as MyType has an `id: string` attached to it.

## Table Smart

The table smart is an extension `ListSmart` from `x-ui`, but this one is designed to work specifically with `Table` from `antd` package.

```tsx
export class PostsAntTableSmart extends AntTableSmart<Post> {
  // "Posts" represents the UICollection
  collectionClass = Posts;

  // This represents the Nova query run through collection
  getBody(): QueryBodyType<Post> {
    return {
      title: 1,
      comments: {
        user: {
          fullName: 1,
        },
        text: 1,
      },
    };
  }

  // These are the antd columns: https://ant.design/components/table/#Column
  getColumns(): ColumnsType<Post> {
    return [
      {
        title: "Title",
        key: "title",
        dataIndex: "title",
        // render: text => <a>{text}</a>
      },
    ];
  }

  getSortMap() {
    return {
      // key -> what it sorts
      title: "title",
    };
  }
}
```

Using the smart is pretty straight-forward:

```tsx
import { newSmart, useRouter, useUIComponents } from "@bluelibs/x-ui";
import { useEffect, useState, useMemo } from "react";
import { PlusOutlined, FilterOutlined } from "@ant-design/icons";
import * as Ant from "antd";

export function PostsList() {
  const UIComponents = useUIComponents();
  const router = useRouter();
  const [api, Provider] = newSmart(PostsAntTableSmart);
  const onFiltersUpdate = useMemo(() => {
    return (filters) => {
      api.setFlexibleFilters(filters);
    };
  }, []);

  return (
    <UIComponents.AdminLayout>
      <Ant.Layout.Content>
        <Provider>
          <Ant.Input.Search
            name="Search"
            placeholder="Search"
            className="search"
            onKeyUp={(e) => {
              const value = (e.target as HTMLInputElement).value;
              api.setFilters({
                // Customise your search filters!
                title: new RegExp(`${value}`, "i"),
              });
            }}
          />
          <Ant.Table {...api.getTableProps()} />
        </Provider>
      </Ant.Layout.Content>
    </UIComponents.AdminLayout>
  );
}
```

## Custom Components

The components which extend the `UIComponents` from `x-ui` can be found [inside here](https://github.com/bluelibs/bluelibs/tree/main/packages/x-ui-admin/src/react/components)

You can easily override them, as their file name is exactly the name inside `UIComponents`.

## XForm

Since we rely on `ant` for our frontend, we also use `Form` components from `ant` which are really flexible and complex. Because our goal with our libs is to move as much as possible from the visual components we structure our forms in classes:

```tsx
import { XForm } from "@bluelibs/x-ui-admin";
import { Service, Inject } from "@bluelibs/core";
import * as Ant from "antd";
import {
  UsersCollection,
  CompaniesCollection,
} from "@bundles/UIAppBundle/collections";

// Note transience we'll soon identify why
@Service({ transient: true })
export class CompanyEditForm extends XForm {
  @Inject(() => CompaniesCollection)
  collection: CompaniesCollection;

  build() {
    // You can use certain components of  your choice
    const { UIComponents } = this;

    this.add([
      {
        id: "name",
        label: "Name",
        name: ["name"],
        rules: [], // Ant Form Rules: https://ant.design/components/form/#Rule
        initialValue: "John Smith",

        // You can either use render or specify component. Please be careful, you always have to have input right under Form.Item
        render: (props) => (
          <Ant.Form.Item {...props}>
            <Ant.Input />
          </Ant.Form.Item>
        ),

        // Equivalent to the above is:
        component: Ant.Input,
        // Add additional props to the input component
        componentProps: {},

        // Pass props to Form.Item, gets into props from render() and works with custom component and custom render()
        formItemProps: {},
      },
      // The rest of form items
    ]);
    // You can also add them one by one, up to you.
  }

  onSubmit(data) {
    // Handle the data however you wish, you can inject ApolloClient or use the collection directly to perform manipulations
  }
}
```

In order to use this form we employ the `Consumer` pattern:

```tsx
import { use } from "@bluelibs/x-ui";

function CompanyCreateForm() {
  // Transient means a new instance every time, do not omit this
  const form = use(CompanyEditForm, { transient: true });
  // Now you have to build it
  form.build();

  // The main concept here is that this form can be rendered
  // But also customised
  return (
    <Ant.Form onFinish={(document) => form.onSubmit(props.id, document)}>
      {form.render()}
      <Ant.Form.Item>
        <Ant.Button type="primary" htmlType="submit">
          Submit
        </Ant.Button>
      </Ant.Form.Item>
    </Ant.Form>
  );
}

// Customise forms by rendering certain items in a different way
function CompanyCreateForm() {
  const form = use(CompanyEditForm, { transient: true });

  // You can update or remove certain items
  form.build();
  form.update("title", {
    render: "...",
  });

  return (
    <Ant.Form onFinish={(document) => form.onSubmit(props.id, document)}>
      <Wrap>{form.render("item")}</Wrap>

      <h1>Rest of elements to render:</h1>
      {form.render()}
      <Ant.Form.Item>
        <Ant.Button type="primary" htmlType="submit">
          Submit
        </Ant.Button>
      </Ant.Form.Item>
    </Ant.Form>
  );
}
```

:::caution
The input component under `Form.Item` has to be direct and only child, something like this will fail:

```tsx
render() {
  // FAILS
  return (
    <Ant.Form.Item>
      <div><Ant.Input /></div>
    </Ant.Form.Item>
  )
}
```

:::

If you have a lot of changes to make to your initial form. Typically if you use Blueprint, such a form will be generated and you may want to change how you render certain fields:

```tsx
// Do not forget transient, you need a new instance every time you fetch it from the container.
@Service({ transient: true })
class MyForm extends BaseGeneratedForm {
  build() {
    super.build();
    this.update("item", { .... })
  }
}
```

## XList

This is designed to work easily with `Table` from `ant` and this consumer represents a list of columns (`ColumnType`). It's the same pattern and same concepts as XForm:

```tsx
@Service({ transient: true })
export class BillHeadList extends XList<BillHead> {
  build() {
    const { UIComponents, router } = this;

    this.add([
      {
        // The id always needs to be here
        id: "invoiceNumber",

        // The rest under are ColumnType elements
        title: "Invoice Number",
        key: "Invoice Number",
        dataIndex: ["invoiceNumber"],
        sorter: true,
        render: (value, model) => {
          const props = {
            type: "string",
            value,
          };
          return <UIComponents.AdminListItemRenderer {...props} />;
        },
      },
    ]);
  }
}
```

## XViewer

Same concepts as with Forms and Lists apply. This is designed to work very well with `Description`.

```tsx
type XViewElementType = {
  id: string;
  label?: string;
  dataIndex: string[];
  /**
   * If it's nested a component is not needed
   */
  render?: (value: any) => JSX.Element;
};
```

The typical viewer component would look like this:

```tsx
export function BillHeadsViewComponent(props: { document: Partial<BillHead> }) {
  const document = props.document;

  const viewer = use(BillHeadViewer, { transient: true });
  // Notice that we need to set the document so it knows how to render the data
  // In Forms and Lists we don't do this as this is being handled by Ant's underlying systems
  viewer.setDocument(document);

  viewer.build();

  return (
    <Ant.Descriptions>
      {viewer.rest().map((item) => {
        // Iterating and consuming "rest", this is just like walking through the elements
        // And rendering them however you please
        return (
          <Ant.Descriptions.Item label={item.label}>
            {viewer.render(item)}
          </Ant.Descriptions.Item>
        );
      })}
    </Ant.Descriptions>
  );
}
```
