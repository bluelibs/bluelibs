export interface IRoute<T = IRouteParams, Q = IRouteParams> {
  name?: string;
  /**
   * If the user has any of these roles, the route will render, otherwise it will render the component: "NotAuthorized" which can be modified
   */
  roles?: string[];
  path: string;
  // Type parameters are used by consumers of this interface
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _typeParams?: { params: T; query: Q };
}

export type RouteMap = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: IRoute<any>;
};

export interface IRouteGenerationProps<T = any, Q = any> {
  params?: T;
  query?: Q;
}

export interface IRouteParams {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: string | number;
}
