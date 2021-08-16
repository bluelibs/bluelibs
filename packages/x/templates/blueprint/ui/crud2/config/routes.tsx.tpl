/** @overridable */
import { IRoute } from "@bluelibs/x-ui";

{{# if (hasFeature "list") }}
import { {{ generateComponentName "list" }} } from "../components/List/{{ collectionName }}List";
{{/ if }}
{{# if (hasFeature "create") }}
import { {{ generateComponentName "create" }} } from "../components/Create/{{ collectionName }}Create";
{{/ if }}
{{# if (hasFeature "edit") }}
import { {{ generateComponentName "edit" }} } from "../components/Edit/{{ collectionName }}Edit";
{{/ if }}
{{# if (hasFeature "view") }}
import { {{ generateComponentName "view" }} } from "../components/View/{{ collectionName }}View";
import { {{ generateComponentName "viewLive" }} } from "../components/View/{{ collectionName }}ViewLive";
{{/ if }}

import { {{ icon }} } from "@ant-design/icons";

{{# if (hasFeature "list") }}
export const {{ generateRouteName "list" }}: IRoute = {
  path: "/admin/{{ collectionRoutePath }}",
  component: {{ generateComponentName "list" }},
  menu: {
    key: "{{ generateRouteName "list" }}",
    label: "{{ sheetName }}",
    icon: {{ icon }},
  }
};
{{/ if }}

{{# if (hasFeature "create") }}
export const {{ generateRouteName "create" }}: IRoute = {
  path: "/admin/{{ collectionRoutePath }}/create",
  component: {{ generateComponentName "create" }},
};
{{/ if }}

{{# if (hasFeature "edit") }}
export const {{ generateRouteName "edit" }}: IRoute<{ id: string }> = {
  path: "/admin/{{ collectionRoutePath }}/:id/edit",
  component: {{ generateComponentName "edit" }},
};
{{/ if }}

{{# if (hasFeature "view") }}
export const {{ generateRouteName "view" }}: IRoute<{ id: string }> = {
  path: "/admin/{{ collectionRoutePath }}/:id/view",
  component: {{ generateComponentName "view" }},
};

export const {{ generateRouteName "viewLive" }}: IRoute<{ id: string }> = {
  path: "/admin/{{ collectionRoutePath }}/:id/view/live",
  component: {{ generateComponentName "viewLive" }},
};
{{/ if }}