import * as React from "react";
import { IReactEmailTemplate } from "@bluelibs/email-bundle";

export interface IResetPasswordConfirmationEmailProps {
  username: string;
  name: string;
  applicationUrl: string;
  regardsName: string;
}

export function ResetPasswordConfirmationEmail(
  props: IResetPasswordConfirmationEmailProps
) {
  return (
    <div>
      <p>Hello {props.name},</p>
      <p>Your password has been reset: {props.username}.</p>
      <p>
        If this was not you, please inform us as soon as possible, otherwise
        feel free to login:
      </p>
      <p>
        <a href={props.applicationUrl}>{props.applicationUrl}</a>
      </p>
      <p>
        Regards, <br />
        {props.regardsName}
      </p>
    </div>
  );
}

ResetPasswordConfirmationEmail.subject = (props) => {
  return `Your password has been reset!`;
};
