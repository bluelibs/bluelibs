import * as React from "react";
import {
  DatePicker as AntDatePicker,
  DatePickerProps as AntDatePickerProps,
} from "antd";
import * as moment from "moment";

export type DatePickerProps = AntDatePickerProps & {
  onChange?(date: Date);
  required?: boolean;
};

/**
 * It returns Date not moments
 * @param props
 */
export function DatePicker(props?: DatePickerProps) {
  const { onChange, value, required, ...rest } = props;

  return (
    <AntDatePicker
      allowClear={!required}
      onChange={(date) =>
        onChange(date && date.toDate() ? date.toDate() : null)
      }
      value={value ? moment(value) : required ? moment() : null}
      {...rest}
    />
  );
}
