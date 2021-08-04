import React, { useState } from "react";
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
  notification,
} from "antd";

type FormInput = {
  username: string;
  password: string;
};

export function Login() {
  const guardian = useGuardian();

  const router = useRouter();
  const [loginError, setLoginError] = useState(null);
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
        setLoginError(err.toString());
      });
  };

  const style = { minHeight: "100vh" };
  return (
    <Row justify="center" align="middle" style={style}>
      <Col sm={24} md={12} lg={6}>
        <Card title="Application Login">
          <Form
            className="authentication-form"
            onFinish={(data) => onSubmit(data)}
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: "Please input your Email!" }]}
            >
              <Input
                prefix={<UserOutlined className="site-form-item-icon" />}
                placeholder="Email"
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Please input your Password!" },
              ]}
            >
              <Input
                prefix={<LockOutlined className="site-form-item-icon" />}
                type="password"
                placeholder="Password"
              />
            </Form.Item>
            <Form.Item>
              <Link
                className="authentication-form-forgot"
                to={router.path(Routes.FORGOT_PASSWORD)}
              >
                Forgot password
              </Link>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="authentication-form-button"
              >
                Log in
              </Button>
              Or <Link to={router.path(Routes.REGISTER)}>register now!</Link>
            </Form.Item>
            {loginError && <Alert message="Invalid credentials" type="error" />}
          </Form>
        </Card>
      </Col>
    </Row>
  );
}
