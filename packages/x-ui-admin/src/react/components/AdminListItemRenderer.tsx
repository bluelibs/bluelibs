import { IRoute } from "@bluelibs/x-ui";
import { Tag } from "antd";
import * as React from "react";
import { Link } from "react-router-dom";
import * as startCase from "lodash.startcase";

export type AdminListItemRendererProps = {
  value: any;
  /**
   * These should match the Excel Generator
   */
  type:
    | "string"
    | "tag"
    | "date"
    | "enum"
    | "relation"
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
    value = <Tag>{props.value}</Tag>;
  }

  if (props.type === "enum") {
    value = <Tag>{props.labelify ? startCase(props.value) : props.value}</Tag>;
  }

  if (props.type === "boolean") {
    value = <Tag>{props.value ? "Yes" : "No"}</Tag>;
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

  if (value === undefined) {
    return props.value;
  }

  return value;
}
