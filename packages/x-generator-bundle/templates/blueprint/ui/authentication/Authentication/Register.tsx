import { useGuardian, useRouter } from "@bluelibs/x-ui";
import React, { useState } from "react";
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
import { UserOutlined, LockOutlined } from "@ant-design/icons";

type FormInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export function Register() {
  const guardian = useGuardian();
  const router = useRouter();
  const [submitError, setSubmitError] = useState(null);

  const onSubmit = (data: FormInput) => {
    const { email, password, firstName, lastName } = data;
    guardian
      .register({
        email,
        firstName,
        lastName,
        password,
      })
      .then((token) => {
        notification.success({
          message: "Registered!",
          description:
            "You have successfully created your account. We've sent you an email to verify your account.",
        });

        setSubmitError(null);
        router.go(Routes.HOME);
      })
      .catch((err) => {
        setSubmitError(err.toString());
      });
  };

  const style = { minHeight: "100vh" };
  return (
    <Row justify="center" align="middle" style={style}>
      <Col sm={24} md={12} lg={6}>
        <Card title="Registration">
          <Form
            onFinish={(data) => onSubmit(data)}
            className="authentication-form"
          >
            <Form.Item
              name="firstName"
              rules={[
                { required: true, message: "Please input your First Name" },
              ]}
            >
              <Input placeholder="First Name" />
            </Form.Item>
            <Form.Item
              name="lastName"
              rules={[
                { required: true, message: "Please input your Last Name" },
              ]}
            >
              <Input placeholder="Last Name" />
            </Form.Item>
            <Form.Item
              name="email"
              rules={[{ required: true, message: "Please input your Email" }]}
            >
              <Input placeholder="Email" />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Please input your Password" },
              ]}
            >
              <Input.Password placeholder="Password" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="authentication-form-button"
              >
                Register
              </Button>
            </Form.Item>
            {submitError && (
              <Alert message="Invalid credentials" type="error" />
            )}
          </Form>
        </Card>
      </Col>
    </Row>
  );
}
