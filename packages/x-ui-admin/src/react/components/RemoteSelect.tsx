import * as React from "react";
import { Constructor } from "@bluelibs/core";
import { Collection, use, useData } from "@bluelibs/x-ui";
import { Alert, Select, SelectProps, Spin } from "antd";
import { ObjectId } from "@bluelibs/ejson";

export type RemoteSelectProps = SelectProps<any> & {
  collectionClass: Constructor<Collection<any>>;
  field: string;
  idAsString?: boolean;
};

export function RemoteSelect(props: RemoteSelectProps) {
  let { field, collectionClass, idAsString, onChange, value, ...rest } = props;

  if (value) {
    if (Array.isArray(value)) {
      value = value.map((v) => v.toString());
    } else {
      value = value.toString();
    }
  }

  const { data, isLoading, error } = useData(
    props.collectionClass,
    {},
    {
      _id: 1,
      [props.field]: 1,
    }
  );

  if (isLoading) {
    return <Spin />;
  }

  if (error) {
    return <Alert message="Error loading data" type="error" />;
  }

  const options = data.map((d) => (
    <Select.Option key={d._id.toString()} value={d._id.toString()}>
      {d[props.field] ? d[props.field].toString() : "N/A"}
    </Select.Option>
  ));

  return (
    <Select
      value={value}
      allowClear
      onClear={() => {
        if (onchange) {
          onChange(undefined, { id: undefined, label: " " });
        }
      }}
      onChange={(value, option) => {
        if (Array.isArray(value)) {
          onChange &&
            onChange(
              !idAsString && value ? value.map((v) => new ObjectId(v)) : value,
              option
            );
        } else {
          onChange &&
            onChange(
              !idAsString && value ? new ObjectId(value) : value,
              option
            );
        }
      }}
      {...rest}
    >
      {options}
    </Select>
  );
}
