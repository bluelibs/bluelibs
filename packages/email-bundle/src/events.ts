import { Event } from "@bluelibs/core";
import { IEmailSendingTemplateConfig } from "./defs";
import { MailOptions } from "nodemailer/lib/smtp-transport";
import { SentMessageInfo } from "nodemailer";

export class EmailBeforeSendEvent extends Event<{
  emailTemplate: IEmailSendingTemplateConfig;
  mailOptions: MailOptions;
}> {}

export class EmailBeforeRenderEvent extends Event<{
  emailTemplate: IEmailSendingTemplateConfig;
  mailOptions: MailOptions;
}> {}

export class EmailSentEvent extends Event<{
  emailTemplate: IEmailSendingTemplateConfig;
  mailOptions: MailOptions;
  response: SentMessageInfo;
}> {}
