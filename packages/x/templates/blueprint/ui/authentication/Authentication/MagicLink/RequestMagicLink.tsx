import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useGuardian, useRouter, useTranslate } from "@bluelibs/x-ui";
import {
  PhoneOutlined,
  MailOutlined,
  MessageOutlined,
} from "@ant-design/icons";
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
const { TabPane } = Tabs;
type FormInput = {
  username: string;
};

export function RequestMagicLink(props: {
  queryVariables?: { userId?: string };
}) {
  const guardian = useGuardian();
  const { userId } = props.queryVariables;

  const tl = useTranslate("authentication.requestMagicLink");
  const router = useRouter();
  const [linkSentError, setLinkSentError] = useState<ApolloError>(null);
  const [method, setMethod] = useState("email");
  const [username, setUsername] = useState<string>("");

  const onSubmit = () => {
    guardian
      .requestLoginLink({ username, method, userId })
      .then((data) => {
        if (data.magicCodeSent) {
          router.go(Routes.SUBMIT_MAGIC_LINK, {
            query: {
              userId: data.userId,
              method: data.method,
              format: data.magicAuthFormat,
            },
          });
        }
      })
      .catch((err) => {
        console.log(err);
        setLinkSentError(err);
      });
  };

  const style = { minHeight: "100vh" };
  return (
    <Row
      justify="center"
      align="middle"
      style={style}
      className="request-magic-link-page"
    >
      <Col sm={24} md={12} lg={6}>
        <Card title={tl("header")}>
          <Form className="authentication-form" onFinish={(data) => onSubmit()}>
            {userId ? (
              <></>
            ) : (
              <Form.Item name={"username"} rules={[{ required: !userId }]}>
                <Input
                  value={username}
                  prefix={
                    method === "email" ? <MailOutlined /> : <PhoneOutlined />
                  }
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={tl(
                    method === "email" ? "fields.email" : "fields.phoneNumber"
                  )}
                />
              </Form.Item>
            )}
            <Form.Item>
              <a className="authentication-form-magic-code" onClick={onSubmit}>
                {tl("already_have_code")}
              </a>
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
                onClick={onSubmit}
                className="authentication-form-button"
              >
                {tl("send_magic_link")}
              </Button>
            </Form.Item>
            {linkSentError && (
              <Alert
                message={
                  linkSentError.networkError
                    ? linkSentError.toString()
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
