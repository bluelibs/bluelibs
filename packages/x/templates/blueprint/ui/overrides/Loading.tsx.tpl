import * as React from "react";
import { Row, Col, Spin } from "antd";

export function Loading() {
  return (
    <Row justify="center" align="middle" style={ { minHeight: "100vh" } }>
      <Col span={24} style={ { textAlign: "center" } }>
        <Spin size="large" />
      </Col>
    </Row>
  );
}
