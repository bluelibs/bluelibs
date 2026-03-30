import * as React from "react";

import { createContext, createElement, useContext, ReactElement } from "react";

import { WrapperComponentType } from "../defs";

type IChildrenContext = {
  children: React.ReactNode;
  setChildren: (children: React.ReactNode) => void;
};

export const generateWrapperTree = (
  wrappers: WrapperComponentType<any>[],
  index = 0
): ReactElement | null => {
  if (index === wrappers.length) return <ChildrenWrapper />;

  const wrapper = wrappers[index];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let props: any;
  if (typeof wrapper.props === "function") {
    props = wrapper.props();
  } else if (typeof wrapper.props === "object") {
    props = wrapper.props;
  }

  return createElement(
    wrapper.component,
    props,
    generateWrapperTree(wrappers, index + 1)
  );
};

export const ChildrenWrapper = (): React.ReactElement | null => {
  const childrenContext = useContext(ChildrenContext);

  return <>{childrenContext.children}</>;
};

export const ChildrenContext = createContext<IChildrenContext>({
  children: null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  setChildren: (_children: React.ReactNode) => {},
});
