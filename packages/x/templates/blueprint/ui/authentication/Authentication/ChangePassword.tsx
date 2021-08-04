import { useGuardian, useUIComponents, useRouter } from "@bluelibs/x-ui";
import { useState } from "react";
import { LockOutlined } from "@ant-design/icons";
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  Alert,
  Card,
  PageHeader,
  Layout,
} from "antd";

type FormInput = {
  oldPassword: string;
  newPassword: string;
};

export function ChangePassword() {
  const guardian = useGuardian();
  const router = useRouter();
  const UIComponents = useUIComponents();
  const [submitError, setSubmitError] = useState(null);
  const [isCompleted, setIsComplete] = useState(false);

  const onSubmit = (data: FormInput) => {
    const { oldPassword, newPassword } = data;
    guardian
      .changePassword(oldPassword, newPassword)
      .then(() => {
        setIsComplete(true);
      })
      .catch((err) => {
        setSubmitError(err.toString());
      });
  };
  const style = { width: 400, border: 0 };
  return (
    <UIComponents.AdminLayout>
      <PageHeader title="Change your password" />
      <Card style={style}>
        {isCompleted && (
          <Alert type="success" message="Your password has been changed." />
        )}
        {!isCompleted && (
          <Form
            onFinish={(data) => onSubmit(data)}
            className="authentication-form"
          >
            <Form.Item
              name="oldPassword"
              rules={[
                { required: true, message: "Current Password is required" },
              ]}
            >
              <Input
                prefix={<LockOutlined className="site-form-item-icon" />}
                type="password"
                placeholder="Current Password"
              />
            </Form.Item>
            <Form.Item
              name="newPassword"
              rules={[{ required: true, message: "New Password is required" }]}
            >
              <Input
                prefix={<LockOutlined className="site-form-item-icon" />}
                type="password"
                placeholder="New Password"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="authentication-form-button"
              >
                Change Password
              </Button>
            </Form.Item>
            {submitError && <Alert message={`${submitError}`} type="error" />}
          </Form>
        )}
      </Card>
    </UIComponents.AdminLayout>
  );
}
