import * as React from "react";
import "@bluelibs/x-ui";
import { IComponents, IRoute } from "@bluelibs/x-ui";
import "./react/components/types";

declare module "@bluelibs/x-ui" {
  export interface IRoute {
    menu?: IMenuItemConfig;
  }
}

export interface IXUIAdminBundleConfig {
  /**
   * Please only override components starting with Admin{...}
   */
  components: IComponents;
}

export interface IMenuItemConfig {
  key: string;
  label?: string | React.ComponentType;
  isSelected?: (path: string) => boolean;
  roles?: string[];
  icon?: React.ComponentType;
  /**
   * This refers to menu key parent, where to inject the menu, leave empty if you want it top-level
   */
  inject?: string;
  /**
   * Menu items may not be related to a string.
   */
  path?: string;
  // If there is already an "Administration" path, it will get extended
  order?: number; // If you want it to hold priority. The menus will be sorted by order, otherwise, by the order they have been added into the menu
  subitems?: IMenuItemConfig[];
  route?: IRoute;
}

export interface IRouteMenuItemConfig extends IMenuItemConfig {}
