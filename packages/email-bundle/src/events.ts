import { Event } from "@bluelibs/core";
import { IEmailSendingTemplateConfig, SimpleObjectType } from "./defs";
import { MailOptions } from "nodemailer/lib/smtp-transport";
import { SentMessageInfo } from "nodemailer";

export class EmailBeforeSendEvent<Props = SimpleObjectType> extends Event<{
  emailTemplate: IEmailSendingTemplateConfig<Props>;
  mailOptions: MailOptions;
}> {}

export class EmailBeforeRenderEvent<Props = SimpleObjectType> extends Event<{
  emailTemplate: IEmailSendingTemplateConfig<Props>;
  mailOptions: MailOptions;
}> {}

export class EmailSentEvent<Props = SimpleObjectType> extends Event<{
  emailTemplate: IEmailSendingTemplateConfig<Props>;
  mailOptions: MailOptions;
  response: SentMessageInfo;
}> {}
