import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useGuardian, useRouter, useTranslate } from "@bluelibs/x-ui";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { Routes } from "@bundles/UIAppBundle";
import { ApolloError } from "@apollo/client";
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
  notification,
} from "antd";

type FormInput = {
  username: string;
  password: string;
};

export function Login() {
  const guardian = useGuardian();

  const tl = useTranslate("authentication.login");
  const router = useRouter();
  const [loginError, setLoginError] = useState<ApolloError>(null);
  // const { register, handleSubmit, errors } = useForm<FormInput>();
  const onSubmit = (data: FormInput) => {
    const { username, password } = data;
    guardian
      .login(username, password)
      .then(() => {
        notification.success({
          message: "Welcome!",
        });
        router.go(Routes.DASHBOARD);
      })
      .catch((err) => {
        setLoginError(err);
      });
  };

  const style = { minHeight: "100vh" };
  return (
    <Row justify="center" align="middle" style={style} className="login-page">
      <Col sm={24} md={12} lg={6}>
        <Card title={tl("header")}>
          <Form
            className="authentication-form"
            onFinish={(data) => onSubmit(data)}
          >
            <Form.Item name="username" rules={[{ required: true }]}>
              <Input
                prefix={<UserOutlined className="site-form-item-icon" />}
                placeholder={tl("fields.username")}
              />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true }]}>
              <Input
                prefix={<LockOutlined className="site-form-item-icon" />}
                type="password"
                placeholder={tl("fields.password")}
              />
            </Form.Item>
            <Form.Item>
              <Link
                className="authentication-form-forgot"
                to={router.path(Routes.FORGOT_PASSWORD)}
              >
                {tl("forgotPassword_btn")}
              </Link>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="authentication-form-button"
              >
                {tl("login")}
              </Button>
              {tl("or")}{" "}
              <Link to={router.path(Routes.REGISTER)}>
                {tl("register_action")}
              </Link>
            </Form.Item>
            {loginError && (
              <Alert
                message={
                  loginError.networkError
                    ? loginError.toString()
                    : tl("invalid_credentials")
                }
                type="error"
              />
            )}
          </Form>
        </Card>
      </Col>
    </Row>
  );
}
