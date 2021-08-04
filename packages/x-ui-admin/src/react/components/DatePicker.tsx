import * as React from "react";
import {
  DatePicker as AntDatePicker,
  DatePickerProps as AntDatePickerProps,
} from "antd";
import * as moment from "moment";

export type DatePickerProps = AntDatePickerProps & {
  onChange?(date: Date);
};

/**
 * It returns Date not moments
 * @param props
 */
export function DatePicker(props?: DatePickerProps) {
  const { onChange, value, ...rest } = props;

  return (
    <AntDatePicker
      onChange={(date) => onChange(date.toDate())}
      value={value ? moment(value) : moment()}
      {...rest}
    />
  );
}
