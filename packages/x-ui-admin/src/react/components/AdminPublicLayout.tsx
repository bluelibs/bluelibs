import * as React from "react";

export type PublicLayout = {
  children?: React.ReactNode;
};

export function PublicLayout(props: PublicLayout) {
  return <div>{props.children}</div>;
}
