import * as React from "react";

export type PublicLayout = {
  children?: any;
};

export function PublicLayout(props: PublicLayout) {
  return <div>{props.children}</div>;
}
