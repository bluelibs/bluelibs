/** @overridable */
import { IRoute } from "@bluelibs/x-ui";
import * as React from "react";
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
{{/ if }}

import { {{ icon }} } from "@ant-design/icons";

{{#*inline "nullComponent"}}
component: () => {
  console.error("This route is not available.");
  return null;
}
{{/inline}}

export const {{ generateRouteName "list" }}: IRoute = {
  path: "/admin/{{ collectionRoutePath }}",
  {{# if (hasFeature "list") }}
    component: {{ generateComponentName "list" }},
    menu: {
      key: "{{ generateRouteName "list" }}",
      label: "management.{{ generateI18NName }}.menu.title",
      icon: {{ icon }},
    }
  {{ else }}
    {{> nullComponent }}
  {{/ if }}
};

export const {{ generateRouteName "create" }}: IRoute = {
  path: "/admin/{{ collectionRoutePath }}/create",
  {{# if (hasFeature "create") }}
  component: {{ generateComponentName "create" }},
  {{ else }}
    {{> nullComponent }}
  {{/ if }}
};

export const {{ generateRouteName "edit" }}: IRoute<{ id: string }> = {
  path: "/admin/{{ collectionRoutePath }}/:id/edit",
  {{# if (hasFeature "edit") }}
  component: {{ generateComponentName "edit" }},
  {{ else }}
    {{> nullComponent }}
  {{/ if }}
};

export const {{ generateRouteName "view" }}: IRoute<{ id: string }> = {
  path: "/admin/{{ collectionRoutePath }}/:id/view",
  {{# if (hasFeature "view") }}
  component: {{ generateComponentName "view" }},
  {{ else }}
    {{> nullComponent }}
  {{/ if }}
};
