import * as React from "react";
import { Layout, PageHeader } from "antd";
import { useState } from "react";
import { useUIComponents } from "@bluelibs/x-ui";

const { Header, Content, Footer, Sider } = Layout;

export type AdminLayoutProps = {
  children?: any;
  protect?: boolean;
};

export function AdminLayout(props: AdminLayoutProps) {
  const protect = props.protect === undefined ? true : props.protect;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const Components = useUIComponents();

  const content = (
    <Layout style={{ minHeight: "100vh" }} className="x-ui-admin">
      <Sider
        breakpoint="md"
        theme={"light"}
        collapsible
        collapsed={isCollapsed}
        onCollapse={(collapsed) => setIsCollapsed(collapsed)}
      >
        <div className="logo">
          <Components.AdminLogo />
        </div>
        <Components.AdminMenu />
      </Sider>
      <Layout className="x-ui-admin-layout">
        <Header className="x-ui-admin-header">
          <Components.AdminTopHeader />
        </Header>
        <Content className="x-ui-admin-content">
          <Components.AdminContent>{props.children}</Components.AdminContent>
        </Content>
        <Footer className="x-ui-admin-footer">
          <Components.AdminFooter />
        </Footer>
      </Layout>
    </Layout>
  );

  if (protect) {
    return <Components.Protect>{content}</Components.Protect>;
  } else {
    return content;
  }
}
