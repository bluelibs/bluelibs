import React from "react";
import { Transport, SentMessageInfo } from "nodemailer";
import { MailOptions } from "nodemailer/lib/smtp-transport";

// why: the loose `any` index signature is part of the published public API.
// Consumers assign React FunctionComponents and props objects of arbitrary
// shape to IReactEmailTemplate / IEmailSendingTemplateConfig (often via the
// default type parameter). A strict `unknown` index signature rejects those
// assignments (unknown is not assignable to concrete prop types) and makes
// EmailBundle's `defaultConfig` unassignable to older @bluelibs/core Bundle
// constraints, so this must stay `any` to remain consumer-compatible.
export type SimpleObjectType = { [key: string]: any };

export interface IGlobalEmailProps {}

export interface IReactEmailTemplate<
  IProps = SimpleObjectType,
> extends React.FC<IProps & IGlobalEmailProps> {
  subject?: (props: IProps & IGlobalEmailProps) => string;
}

export interface ITransporter {
  sendMail(mailOptions: MailOptions): Promise<SentMessageInfo>;
}

export interface IEmailSendingTemplateConfig<IProps = SimpleObjectType> {
  component: IReactEmailTemplate<IProps>;
  props?: IProps;
}

export interface IEmailBundleConfigDefaults {
  from?: string;
  props?: SimpleObjectType;
}

export type ImplicitTransports = "console" | "nodemailer-test";

export type ConfigTransporterType =
  | ImplicitTransports
  | Transport
  | {
      host: string;
      port: number;
      secure?: boolean;
      auth?: {
        user: string;
        pass: string;
      };
    };

export interface IEmailBundleConfig {
  transporter?:
    | ImplicitTransports
    | Transport
    | {
        host: string;
        port: number;
        secure?: boolean;
        auth?: {
          user: string;
          pass: string;
        };
      }
    | null;
  defaults?: IEmailBundleConfigDefaults;
}
