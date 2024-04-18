import * as React from "react";
import { Constructor } from "@bluelibs/core";
import { Collection, use, useData } from "@bluelibs/x-ui";
import { Alert, Select, SelectProps, Spin } from "antd";
import { ObjectId } from "@bluelibs/ejson";
import * as _ from "lodash";

export type RemoteSelectProps = SelectProps<any> & {
  collectionClass: Constructor<Collection<any>>;
  field: string;
  idAsString?: boolean;
  required?: boolean;
};

export function RemoteSelect(props: RemoteSelectProps) {
  let {
    field,
    collectionClass,
    idAsString,
    onChange,
    value,
    required,
    ...rest
  } = props;

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
    _.set({ _id: 1 }, field.split("."), 1)
  );

  if (isLoading) {
    return <Spin />;
  }
  if (error) {
    return <Alert message="Error loading data" type="error" />;
  }

  const options = data.map((d) => (
    <Select.Option key={d._id.toString()} value={d._id.toString()}>
      {_.get(d, field.split("."), "N/A").toString()}
    </Select.Option>
  ));

  return (
    <Select
      value={value}
      allowClear={!required}
      onClear={() => {
        const isArray = Array.isArray(value);
        onChange(isArray ? [] : null, {
          label: "Cleared",
          value: undefined,
        });
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
