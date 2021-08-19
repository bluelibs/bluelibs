import { useGuardian, useRouter, useTranslate } from "@bluelibs/x-ui";
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
  const tl = useTranslate("authentication.resetPassword");
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
    <Row
      justify="center"
      align="middle"
      style={style}
      className="reset-password-page"
    >
      <Col sm={24} md={12} lg={6}>
        <Card title={tl("header")}>
          {isCompleted && <Alert type="success" message={tl("success_msg")} />}
          {!isCompleted && (
            <Form
              onFinish={(data) => onSubmit(data)}
              className="authentication-form"
            >
              <Form.Item name="email" rules={[{ required: true }]}>
                <Input placeholder={tl("fields.email")} />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true }]}>
                <Input
                  prefix={<LockOutlined className="site-form-item-icon" />}
                  type="password"
                  placeholder={tl("fields.password")}
                />
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
          )}
        </Card>
      </Col>
    </Row>
  );
}
