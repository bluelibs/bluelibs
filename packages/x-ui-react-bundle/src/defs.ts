import { ComponentType } from "react";
import { IComponents } from "./react/components";

export interface WrapperComponentType<T> {
  component: ComponentType<T> | ((props: T) => JSX.Element);
  props?: Partial<Omit<T, "children">> | (() => Partial<Omit<T, "children">>);
}

export type WrapperType<T> = WrapperComponentType<T> & {
  order: number;
};

export type IXUIReactBundleConfigType = {
  wrappers: WrapperType<any>[];

  components?: Partial<IComponents>;

  initialisingComponent?: React.ComponentType;
};

export type UserRolesType = "anonymous" | string[];
