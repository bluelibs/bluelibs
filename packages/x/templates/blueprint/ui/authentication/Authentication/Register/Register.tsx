import { useGuardian, useRouter, useTranslate } from "@bluelibs/x-ui";
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
  const tl = useTranslate("authentication.register");
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
          message: tl("success.header"),
          description: tl("success.description"),
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
    <Row
      justify="center"
      align="middle"
      style={style}
      className="register-page"
    >
      <Col sm={24} md={12} lg={6}>
        <Card title={tl("header")}>
          <Form
            onFinish={(data) => onSubmit(data)}
            className="authentication-form"
          >
            <Form.Item name="firstName" rules={[{ required: true }]}>
              <Input placeholder={tl("fields.firstName")} />
            </Form.Item>
            <Form.Item name="lastName" rules={[{ required: true }]}>
              <Input placeholder={tl("fields.lastName")} />
            </Form.Item>
            <Form.Item name="email" rules={[{ required: true }]}>
              <Input placeholder={tl("fields.email")} />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true }]}>
              <Input.Password placeholder={tl("fields.password")} />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="authentication-form-button"
              >
                {tl("submit")}
              </Button>
            </Form.Item>
            {submitError && <Alert message={submitError} type="error" />}
          </Form>
        </Card>
      </Col>
    </Row>
  );
}
