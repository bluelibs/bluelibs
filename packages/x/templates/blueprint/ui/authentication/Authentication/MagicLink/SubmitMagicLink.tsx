import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useGuardian, useRouter, useTranslate } from "@bluelibs/x-ui";
import { NumberOutlined } from "@ant-design/icons";
import { Routes } from "@bundles/UIAppBundle";
import { ApolloError } from "@apollo/client";
import {
  Layout,
  Form,
  Input,
  Checkbox,
  Button,
  Tabs,
  Row,
  Col,
  Alert,
  Card,
  notification,
} from "antd";
type FormInput = {
  code: string;
};

export const SubmitMagicLink = (props: {
  queryVariables: {
    userId: string;
    code?: string;
    method?: string;
    format?: string;
  };
}) => {
  const guardian = useGuardian();
  const { userId, code } = props.queryVariables;

  const tl = useTranslate("authentication.submitMagicLink");
  const router = useRouter();
  const [validCodeError, setValidCodeError] = useState<ApolloError>(null);

  useEffect(() => {
    if (!userId) {
      router.go(Routes.REQUEST_MAGIC_LINK);
    }
    if (code) {
      onSubmit({ code });
    }
  }, []);

  const onSubmit = (data: FormInput) => {
    guardian
      .verifyMagicCode(userId, data.code)
      .then(() => {
        notification.success({
          message: "Welcome!",
        });
        router.go(Routes.DASHBOARD);
      })
      .catch((err) => {
        setValidCodeError(err);
      });
  };

  const style = { minHeight: "100vh" };

  return (
    <Row
      justify="center"
      align="middle"
      style={style}
      className="submit-magic-link-page"
    >
      <Col sm={24} md={12} lg={6}>
        <Card title={tl("header")}>
          <Form
            className="authentication-form"
            onFinish={(data) => onSubmit(data)}
          >
            <Form.Item name={"code"} rules={[{ required: true }]}>
              <Input
                prefix={<NumberOutlined />}
                placeholder={tl("magic_code_field")}
              />
            </Form.Item>
            <Form.Item>
              <Link
                className="authentication-form-magic-code"
                to={router.path(Routes.REQUEST_MAGIC_LINK)}
              >
                {tl("send_link_again")}
              </Link>
            </Form.Item>
            <Form.Item>
              <Link
                className="authentication-form-login"
                to={router.path(Routes.LOGIN)}
              >
                {tl("simple_login_btn")}
              </Link>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="authentication-form-button"
              >
                {tl("submit_magic_link")}
              </Button>
            </Form.Item>
            {validCodeError && (
              <Alert
                message={
                  validCodeError.networkError
                    ? validCodeError.toString()
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
};
