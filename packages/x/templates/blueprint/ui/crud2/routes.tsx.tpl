import { IRoute } from "@bluelibs/x-ui";
import "./i18n";

import {
  {{ generateRouteName "list" }} as BASE_{{ generateRouteName "list" }},
  {{ generateRouteName "create" }} as BASE_{{ generateRouteName "create" }},
  {{ generateRouteName "edit" }} as BASE_{{ generateRouteName "edit" }},
  {{ generateRouteName "view" }} as BASE_{{ generateRouteName "view" }},
} from "./config/routes";

export const {{ generateRouteName "list" }}: IRoute = {
  ...BASE_{{ generateRouteName "list" }}
}

export const {{ generateRouteName "create" }}: IRoute = {
  ...BASE_{{ generateRouteName "create" }}
}

export const {{ generateRouteName "edit" }}: IRoute = {
  ...BASE_{{ generateRouteName "edit" }}
}

export const {{ generateRouteName "view" }}: IRoute = {
  ...BASE_{{ generateRouteName "view" }}
}
