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

export function NotFound() {
  const guardian = useGuardian();
  const router = useRouter();

  const style = { minHeight: "100vh" };
  const { isLoggedIn } = guardian.state;

  return (
    <Row justify="center" align="middle" style={style}>
      <Col sm={24} md={16} lg={8}>
        <Card title="404 Error">
          <p>
            The route you tried to access could not be found.
          </p>

          <p>
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
