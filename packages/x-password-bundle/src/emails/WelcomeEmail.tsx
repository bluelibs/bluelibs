import * as React from "react";
import { IReactEmailTemplate } from "@bluelibs/email-bundle";

export interface IWelcomeEmailProps {
  name: string;
  applicationName: string;
  regardsName: string;
  welcomeUrl: string;
}

export function WelcomeEmail(props: IWelcomeEmailProps) {
  return (
    <div>
      <p>Hello {props.name},</p>

      <p>A warm Welcome to {props.applicationName}!</p>
      <p>
        Feel free to access the application:
        <br />
        <a href={props.welcomeUrl}>{props.welcomeUrl}</a>
      </p>
      <p>
        Regards, <br />
        {props.regardsName}
      </p>
    </div>
  );
}

WelcomeEmail.subject = (props) => {
  return `Welcome to ${props.applicationName}, ${props.name}!`;
};
