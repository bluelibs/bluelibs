export interface IRoute<T = IRouteParams, Q = IRouteParams> {
  name?: string;
  /**
   * If the user has any of these roles, the route will render, otherwise it will render the component: "NotAuthorized" which can be modified
   */
  roles?: string[];
  path: string;
  defaultLocale?: string;
}

export type RouteMap = {
  [key: string]: IRoute<any>;
};

export interface IRouteGenerationProps<T = any, Q = any> {
  params?: T | { locale: string };
  query?: Q;
  locale?: string;
}

export interface IRouteParams {
  [key: string]: string | number;
}
