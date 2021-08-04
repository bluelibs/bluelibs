import * as React from "react";
import { Layout } from "antd";
import { Content } from "antd/lib/layout/layout";
import { useUIComponents } from "@bluelibs/x-ui";

export type AdminContentProps = {
  children?: any;
};

const contentStyles = {
  margin: "16px",
  padding: "16px",
  background: "#FFF",
};

export function AdminContent(props: AdminContentProps) {
  const UIComponents = useUIComponents();
  return (
    <UIComponents.ErrorBoundary>
      <Content style={contentStyles}>{props.children}</Content>
    </UIComponents.ErrorBoundary>
  );
}
