import * as React from "react";
import { IReactEmailTemplate } from "@bluelibs/email-bundle";

export interface I{{ emailName }}EmailProps {
  name: string;
}

export const {{ emailName }}Email: IReactEmailTemplate<I{{ emailName }}EmailProps> = (
  props: I{{ emailName}}EmailProps
) => {
  return <div>Hello {props.name}</div>;
};

{{ emailName }}Email.subject = (props) => `Hello ${props.name}`;