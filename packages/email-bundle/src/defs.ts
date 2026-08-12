import React from "react";
import { Transport, SentMessageInfo } from "nodemailer";
import { MailOptions } from "nodemailer/lib/smtp-transport";

// why: part of the published public API — must stay `any` to remain
// consumer-compatible. A strict `unknown` index makes EmailBundle's
// `defaultConfig` unassignable to core's `Bundle` constraint (TS2416) and
// turns template prop reads into `unknown`.
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
