import { useGuardian, useRouter } from "@bluelibs/x-ui";
import React, { useState } from "react";
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
  email: string;
};

export function ForgotPassword() {
  const guardian = useGuardian();
  const router = useRouter();
  const [submitError, setSubmitError] = useState(null);
  const [isCompleted, setIsComplete] = useState(false);

  const onSubmit = (data: FormInput) => {
    guardian
      .forgotPassword(data.email)
      .then(() => {
        setIsComplete(true);
      })
      .catch((err) => {
        setSubmitError(err.toString());
      });
  };

  const style = { minHeight: "100vh" };
  return (
    <Row justify="center" align="middle" style={style}>
      <Col sm={24} md={12} lg={6}>
        <Card title="Forgot Password">
          {isCompleted && (
            <Alert
              type="success"
              message="If the email exists in our database, you will receive an email with
        instructions."
            />
          )}
          {!isCompleted && (
            <Form
              onFinish={(data) => onSubmit(data)}
              className="authentication-form"
            >
              <Form.Item
                name="email"
                rules={[{ required: true, message: "Please input your Email" }]}
              >
                <Input placeholder="Email" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="authentication-form-button"
                >
                  Recover Password
                </Button>
              </Form.Item>
              {submitError && (
                <Alert
                  message="There was an error with your request"
                  type="error"
                />
              )}
            </Form>
          )}
        </Card>
      </Col>
    </Row>
  );
}
