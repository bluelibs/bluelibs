import { Collection, useUIComponents, use } from "@bluelibs/x-ui";
import { useEffect, useState } from "react";
import { Card, PageHeader, Row, Col } from "antd";
import { Constructor } from "@bluelibs/core";
import { Collections } from "@bundles/UIAppBundle";

export function Dashboard() {
  const UIComponents = useUIComponents();

  const cards = Object.values(Collections)
    .filter((v) => Boolean(v))
    .map((collectionClass, idx: number) => {
      if (collectionClass === null) {
        return null;
      }
      return (
        <Col span={8} key={idx}>
          <DashboardStats collectionClass={collectionClass} key={idx} />
        </Col>
      );
    });
  return (
    <UIComponents.AdminLayout>
      <PageHeader title="Dashboard" />

      <Card>
        <Row gutter={[16, 24]}>{cards}</Row>
      </Card>
    </UIComponents.AdminLayout>
  );
}

export function DashboardStats(props: {
  collectionClass: Constructor<Collection>;
}) {
  const collection = use(props.collectionClass);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    collection.count({}).then((result) => {
      setCount(result);
    });
  }, []);

  return (
    <Card title={collection.getName()}>
      <h1>Total: {count}</h1>
    </Card>
  );
}
