import * as React from "react";
import { Constructor } from "@bluelibs/core";
import { Collection, QueryBodyType, use, useData } from "@bluelibs/x-ui";
import { Alert, Select, SelectProps, Spin } from "antd";
import { ObjectId } from "@bluelibs/ejson";

export interface OnSelectDataChangeOptions {
  onChange: () => void;
  isArray: boolean;
  value: any;
}

export type RemoteSelectProps = SelectProps<any> & {
  collectionClass: Constructor<Collection<any>>;
  field: string;
  idAsString?: boolean;
  body?: QueryBodyType<any>;

  /**
   * When set, replace the default `onChange` behavior, which will be passed down as seconda argument to this function so you may optionally call it
   * @arg data: The fully fetched data from the collection, incluing fields from the `body` prop
   * @arg options.onChange: The original `onChange` function that you may call if needed
   * @arg options.isArray: Is the data a single doc or an array
   * @arg options.value: The newly changed value of the selector
   */
  onSelect?: (data: any, options: OnSelectDataChangeOptions) => void;
};

const RemoteSelector = (props: RemoteSelectProps) => {
  let {
    field,
    collectionClass,
    idAsString,
    onChange,
    value,
    body = {},
    onSelect,
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
    {
      _id: 1,
      [props.field]: 1,
      ...body,
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
      onChange={(value, option) => {
        const isArray = Array.isArray(value);

        onSelect &&
          onSelect(
            data.filter(
              isArray
                ? (doc) => value.includes(doc._id)
                : (doc) => doc._id === value
            ),
            { value }
          );

        if (isArray) {
          onChange &&
            onChange(
              !idAsString ? value.map((v) => new ObjectId(v)) : value,
              option
            );
        } else {
          onChange &&
            onChange(!idAsString ? new ObjectId(value) : value, option);
        }
      }}
      {...rest}
    >
      {options}
    </Select>
  );
};

export default React.memo(RemoteSelector);
