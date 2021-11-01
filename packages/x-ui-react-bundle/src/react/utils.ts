import React, { createElement } from "react";
import { WrapperComponentType } from "..";

export const generateWrapperTree = (
  wrappers: WrapperComponentType<any>[],
  index = 0
) => {
  if (index === wrappers.length) return null;

  const wrapper = wrappers[index];

  return createElement(
    wrapper.component,
    wrapper.props && wrapper.props(),
    generateWrapperTree(wrappers, index + 1)
  );
};
