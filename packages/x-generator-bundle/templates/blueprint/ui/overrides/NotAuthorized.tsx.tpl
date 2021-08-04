import * as React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useGuardian, useRouter } from "@bluelibs/x-ui";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { Routes } from "@bundles/UIAppBundle";
import {
  Layout,
  Form,
  Input,
  Checkbox,
  Button,
  Space,
  Row,
  Col,
  Alert,
  Card,
} from "antd";

export function NotAuthorized() {
  const guardian = useGuardian();
  const router = useRouter();

  const style = { minHeight: "100vh" };
  const { user, isLoggedIn } = guardian.state;
  const firstName = user?.profile?.firstName;

  return (
    <Row justify="center" align="middle" style={style}>
      <Col sm={24} md={16} lg={8}>
        <Card title="Authorisation Error">
          {isLoggedIn && <p>You are already logged in as {firstName}.</p>}

          <Alert
            type="error"
            message="The page you tried to access is not authorized for you."
          />

          <p>
            <br />
            <Space>
              {isLoggedIn && (
                <Link to={router.path(Routes.DASHBOARD)}>
                  <Button>Dashboard</Button>
                </Link>
              )}
              {!isLoggedIn && (
                <Link to={router.path(Routes.LOGIN)}>
                  <Button>Login</Button>
                </Link>
              )}
            </Space>
          </p>
        </Card>
      </Col>
    </Row>
  );
}
