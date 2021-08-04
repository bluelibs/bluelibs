import * as React from "react";
import { Layout } from "antd";

export type PageWrapperProps = {
  title: string;
  children?: any;
};

export function AdminPageWrapper(props: PageWrapperProps) {
  return (
    <div>
      <h1>{props.title}</h1>
      <div>{props.children}</div>
    </div>
  );
}
