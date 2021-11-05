import * as React from "react";

import { createContext, createElement, useContext } from "react";

import { WrapperComponentType } from "../defs";

type IChildrenContext = {
  children: JSX.Element;
  setChildren: (children: JSX.Element) => void;
};

export const generateWrapperTree = (
  wrappers: WrapperComponentType<any>[],
  index = 0
) => {
  if (index === wrappers.length) return <ChildrenWrapper />;

  const wrapper = wrappers[index];

  return createElement(
    wrapper.component,
    wrapper.props && wrapper.props(),
    generateWrapperTree(wrappers, index + 1)
  );
};

export const ChildrenWrapper = () => {
  const childrenContext = useContext(ChildrenContext);

  return childrenContext.children;
};

export const ChildrenContext = createContext<IChildrenContext>(null);
