import { useGuardian, useRouter } from "@bluelibs/x-ui";
import React, { useEffect, useState } from "react";
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

export function VerifyEmail(props: { token: string }) {
  const { token } = props;
  const guardian = useGuardian();
  const router = useRouter();

  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(true);
  const [emailVerificationError, setEmailVerificationError] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      guardian
        .verifyEmail(token)
        .then(() => {
          setIsVerifyingEmail(false);
          setIsEmailVerified(true);
          setTimeout(() => {
            router.go(Routes.DASHBOARD);
          }, 3500);
        })
        .catch((err) => {
          setIsVerifyingEmail(false);
          setEmailVerificationError(err.toString());
        });
    }, 1000);
  }, []);
  const style = { minHeight: "100vh" };
  return (
    <Row justify="center" align="middle" style={style}>
      <Col sm={24} md={12} lg={6}>
        <Card title="Verification Step">
          {isVerifyingEmail && <Alert message="Verifying your email..." />}
          {isEmailVerified && (
            <Alert
              type="success"
              message="Your email has been verified. Redirecting ..."
            />
          )}
          {emailVerificationError && (
            <Alert
              type="error"
              message="We could not verify your email. Maybe it was already verified."
            />
          )}
        </Card>
      </Col>
    </Row>
  );
}
