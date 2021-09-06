import { IRoute } from "@bluelibs/x-ui";
import { Button, Tag, Tooltip } from "antd";
import * as React from "react";
import { Link } from "react-router-dom";
import { DownloadOutlined } from "@ant-design/icons";
import * as startCase from "lodash.startcase";

export type AdminListItemRendererProps = {
  value: any;
  type:
    | "string"
    | "tag"
    | "date"
    | "enum"
    | "relation"
    | "file"
    | "fileGroup"
    | "number"
    | "boolean"
    | "object"
    | string;
  relation?: {
    path: string;
    dataIndex: string;
  };
  /**
   * Transforms an enum looking like IN_PROGRESS to In Progress
   */
  labelify?: boolean;
};

export function DownloadButton({ name, downloadUrl }) {
  return (
    <Button href={downloadUrl} target="_blank" icon={<DownloadOutlined />}>
      {name}
    </Button>
  );
}

/**
 * @param props
 */
export function AdminListItemRenderer(props: AdminListItemRendererProps) {
  let value;

  if (props.type === "string" || props.type === "number") {
    value = <span>{props.value}</span>;
  }

  if (props.type === "date") {
    if (props.value instanceof Date) {
      value = props.value.toLocaleDateString();
    } else {
      value = new Date(props.value as number).toLocaleDateString();
    }
  }

  if (props.type === "tag") {
    value = <Tag color="cyan">{props.value}</Tag>;
  }

  if (props.type === "enum") {
    value = (
      <Tag color="cyan">
        {props.labelify ? startCase(props.value) : props.value}
      </Tag>
    );
  }

  if (props.type === "boolean") {
    value = <Tag color="blue">{props.value ? "Yes" : "No"}</Tag>;
  }

  if (props.type === "file") {
    if (Array.isArray(props.value)) {
      value = (
        <>
          {props.value.map((file, idx) => (
            <DownloadButton {...file} key={idx} />
          ))}
        </>
      );
    } else {
      if (props.value) {
        value = <DownloadButton {...props.value} name={null} />;
      }
    }
  }

  if (props.type === "fileGroup") {
    if (!props.value) {
      value = "N/A";
    } else {
      value = (
        <>
          {props.value.files.map((file, idx) => (
            <DownloadButton {...file} key={idx} />
          ))}
        </>
      );
    }
  }

  if (props.type === "relation") {
    if (!props.value) {
      return <Tag>N/A</Tag>;
    }

    value = (
      <Link to={props.relation.path}>
        <Tag>{props.value[props.relation.dataIndex]}</Tag>
      </Link>
    );
  }

  if (props.type === "object") {
    value = <pre>{JSON.stringify(props.value, null, 4)}</pre>;
  }

  if (value === undefined || value === null) {
    return `N/A`;
  }

  return value;
}
