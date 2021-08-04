import React from "react";
import classnames from "classnames";

export function TextHighlight({ children, strong }) {
  return (
    <span
      className={classnames({
        "text-highlight": true,
        "text-highlight-strong": Boolean(strong),
      })}
    >
      {children}
    </span>
  );
}
