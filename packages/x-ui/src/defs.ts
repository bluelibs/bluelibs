import * as React from "react";
import { RouteProps } from "react-router-dom";
import { ApolloClientOptions } from "@apollo/client/core";
import { GuardianSmart } from "./react";
import { Constructor } from "@bluelibs/core";
import { IComponents } from "./react";
import { IUISessionStore } from "./react/services/UISession.service";
import * as Polyglot from "node-polyglot";

export type XUIBundleConfigType = {
  graphql: Partial<ApolloClientOptions<any>>;
  guardianClass: Constructor<GuardianSmart>;
  enableSubscriptions: boolean;
  react: {
    components: IComponents;
  };
  session: {
    localStorageKey?: string;
    defaults?: IUISessionStore;
  };
  i18n: {
    defaultLocale: string;
    /**
     * This is used for when you want customly configured polyglots allowing you to customise the options
     */
    polyglots: Array<Polyglot.PolyglotOptions & { locale: string }>;
  };
};

export interface IRoute<T = IRouteParams, Q = IRouteParams> extends RouteProps {
  name?: string;
  /**
   * If the user has any of these roles, the route will render, otherwise it will render the component: "NotAuthorized" which can be modified
   */
  roles?: string[];
  path: string;
}

export type RouteMap = {
  [key: string]: IRoute<any>;
};

export interface IRouteGenerationProps<T = any, Q = any> {
  params?: T;
  query?: Q;
}

export type UserRolesType = "anonymous" | string[];

export interface IRouteParams {
  [key: string]: string | number;
}
