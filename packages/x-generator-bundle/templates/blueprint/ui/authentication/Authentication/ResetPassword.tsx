import { useGuardian, useRouter } from "@bluelibs/x-ui";
import { useState } from "react";
import { LockOutlined } from "@ant-design/icons";
import { Routes } from "@bundles/UIAppBundle";
import { Form, Input, Button, Row, Col, Alert, Card } from "antd";

type FormInput = {
  email: string;
  password: string;
};

export function ResetPassword(props: { token: string }) {
  const guardian = useGuardian();
  const router = useRouter();
  const [submitError, setSubmitError] = useState(null);
  const [isCompleted, setIsComplete] = useState(false);

  const onSubmit = (data: FormInput) => {
    const { email, password } = data;
    guardian
      .resetPassword(email, props.token, password)
      .then(() => {
        setIsComplete(true);
        setTimeout(() => {
          router.go(Routes.HOME);
        }, 4500);
      })
      .catch((err) => {
        setSubmitError(err.toString());
      });
  };
  const style = { minHeight: "100vh" };
  return (
    <Row justify="center" align="middle" style={style}>
      <Col sm={24} md={12} lg={6}>
        <Card title="Reset Password">
          {isCompleted && (
            <Alert
              type="success"
              message="Your password has been reset. Redirecting ..."
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
                <Button
                  type="primary"
                  htmlType="submit"
                  className="authentication-form-button"
                >
                  Reset Password
                </Button>
              </Form.Item>
              {submitError && (
                <Alert
                  message={`There was an error with your request: ${submitError}`}
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
