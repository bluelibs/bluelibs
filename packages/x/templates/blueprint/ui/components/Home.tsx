import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useGuardian, useRouter } from "@bluelibs/x-ui";
import { LockOutlined, DashboardFilled, ToolOutlined } from "@ant-design/icons";
import { Routes } from "@bundles/UIAppBundle";
import { Button, Space, Row, Col, Alert, Card } from "antd";

export function Home() {
  const guardian = useGuardian();
  const router = useRouter();

  const style = { minHeight: "100vh" };
  return (
    <Row justify="center" align="middle" style={style}>
      <Col sm={24} md={16} lg={8}>
        <Card title="Welcome to your brand new app!">
          <p>
            This is your application starter url. You can configure this
            behavior in <strong>{`{bundle}/pages/Home`}</strong> folder.
          </p>
          {guardian.state.isLoggedIn && (
            <Alert
              type="success"
              message={`You are logged in as ${guardian.state.user.profile?.firstName}`}
            />
          )}
          <p>
            <br />
            <Space>
              <a href={"/public/schema.html"} target="_blank" rel="noreferrer">
                <Button icon={<ToolOutlined />}>GraphQL Schema</Button>
              </a>
              <a href={process.env.API_URL} target="_blank" rel="noreferrer">
                <Button icon={<ToolOutlined />}>GraphQL Playground</Button>
              </a>
            </Space>
            <br />
            <br />
            <Space>
              <Link to={router.path(Routes.DASHBOARD)}>
                <Button icon={<DashboardFilled />}>Dashboard</Button>
              </Link>
              <Link to={router.path(Routes.LOGIN)}>
                <Button icon={<LockOutlined />}>Login</Button>
              </Link>
            </Space>
          </p>
        </Card>
      </Col>
    </Row>
  );
}
