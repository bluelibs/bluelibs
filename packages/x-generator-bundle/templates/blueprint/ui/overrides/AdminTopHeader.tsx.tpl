import React from "react";
import { DownOutlined } from "@ant-design/icons";
import { useGuardian, useRouter } from "@bluelibs/x-ui";
import { Button, Dropdown, Menu, Space } from "antd";
import { Routes } from "../";

export function AdminTopHeader() {
  const guardian = useGuardian();
  const router = useRouter();
  const { user } = guardian.state;

  if (!guardian.state.initialised || !user) {
    return null;
  }

  const menu = (
    <Menu mode="horizontal" defaultSelectedKeys={["2"]}>
      <Menu.Item key="1" onClick={() => router.go(Routes.HOME)}>
        Home
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="1" onClick={() => router.go(Routes.CHANGE_PASSWORD)}>
        Change Password
      </Menu.Item>
      <Menu.Item
        key="2"
        onClick={() =>
          guardian.logout().then(() => {
            router.go(Routes.LOGIN);
          })
        }
      >
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Space align="end" size={8}>
      <Dropdown overlay={menu} trigger={["click"]}>
        <Button icon={<DownOutlined />}>{user?.profile?.firstName}</Button>
      </Dropdown>
    </Space>
  );
}
