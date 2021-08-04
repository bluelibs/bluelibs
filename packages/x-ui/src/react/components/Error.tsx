import * as React from "react";

export type ErrorProps = {
  error: string | Error;
};

export function Error(props: ErrorProps) {
  const { error } = props;
  return (
    <div>
      An error occured.{" "}
      {error ? error.toString() : "Error could not be displayed."}
    </div>
  );
}
