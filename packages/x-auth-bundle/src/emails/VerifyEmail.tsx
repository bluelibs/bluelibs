import * as React from "react";
import { IReactEmailTemplate } from "@bluelibs/email-bundle";

export interface IVerifyEmailProps {
  name: string;
  verifyEmailUrl: string;
  regardsName: string;
}

export function VerifyEmail(props: IVerifyEmailProps) {
  return (
    <div>
      <p>Hello {props.name},</p>
      <p>
        Thank you for joining us! Please verify your email by clicking the link
        below:
      </p>
      <p>
        <a href={props.verifyEmailUrl}>{props.verifyEmailUrl}</a>
      </p>
      <p>
        Regards, <br />
        {props.regardsName}
      </p>
    </div>
  );
}

VerifyEmail.subject = (props) => {
  return `Please verify your email!`;
};
