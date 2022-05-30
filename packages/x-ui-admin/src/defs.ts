import "@bluelibs/x-ui-router";
import * as React from "react";
import { IComponents, IRoute, QueryBodyType } from "@bluelibs/x-ui";
import "./react/components/types";

declare module "@bluelibs/x-ui-router" {
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
export type OwnField =
  | string
  | [string, string]
  | [string, string][]
  | {
      $or?: ([string, string] | string)[];
      $and?: ([string, string] | string)[];
    };
export interface IRouteMenuItemConfig extends IMenuItemConfig {}
export type UICrudSecurityByRole<T = null> = {
  find?:
    | boolean
    | {
        intersect?: QueryBodyType<T>;
      };
  filters?:
    | boolean
    | {
        allowFilterOn?: Array<keyof T>;
        denyFilterOn?: Array<keyof T>;
      };
  edit?:
    | boolean
    | {
        own?: OwnField;
        allow?: Array<keyof T>;
        deny?: Array<keyof T>;
      };
  create?:
    | boolean
    | {
        allow?: Array<keyof T>;
        deny?: Array<keyof T>;
      };
  delete?: boolean | { own?: OwnField };
};

export type UiCrudSecurity<T = null> = {
  roles: {
    [k: string]: UICrudSecurityByRole<T>;
  };
  defaults: UICrudSecurityByRole<T>;
};
