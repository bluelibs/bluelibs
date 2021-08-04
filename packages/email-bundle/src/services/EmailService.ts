import { Inject, EventManager, Service } from "@bluelibs/core";
import {
  NODEMAILER_INSTANCE,
  NODEMAILER_TEST_MODE,
  EMAIL_DEFAULTS,
} from "../constants";
import { SentMessageInfo } from "nodemailer/lib/smtp-connection";
import {
  IEmailSendingTemplateConfig,
  IEmailBundleConfigDefaults,
  ITransporter,
} from "../defs";
import {
  EmailBeforeSendEvent,
  EmailSentEvent,
  EmailBeforeRenderEvent,
} from "../events";
import { renderToStaticMarkup } from "react-dom/server";
import * as React from "react";
import * as nodemailer from "nodemailer";
import { MailOptions } from "nodemailer/lib/smtp-transport";

@Service()
export class EmailService {
  constructor(
    @Inject(NODEMAILER_INSTANCE)
    protected readonly nodemailerTransporter: ITransporter,
    @Inject(NODEMAILER_TEST_MODE)
    protected readonly isNodemailerOnTestMode: boolean,
    @Inject(EMAIL_DEFAULTS)
    protected readonly emailDefaults: IEmailBundleConfigDefaults,
    protected readonly eventManager: EventManager
  ) {}

  /**
   * Send the email
   * @param email
   */
  async send<Props = any>(
    emailTemplate: IEmailSendingTemplateConfig<Props>,
    mailOptions: MailOptions
  ): Promise<SentMessageInfo> {
    this.applyDefaults(emailTemplate, mailOptions);

    if (!mailOptions.subject && emailTemplate.component.subject) {
      mailOptions.subject = emailTemplate.component.subject(
        emailTemplate.props
      );
    }

    await this.eventManager.emit(
      new EmailBeforeRenderEvent({
        emailTemplate,
        mailOptions,
      })
    );

    mailOptions.html = this.renderEmail(emailTemplate);

    await this.eventManager.emit(
      new EmailBeforeSendEvent({
        emailTemplate,
        mailOptions,
      })
    );

    if (this.nodemailerTransporter) {
      const response = await this.nodemailerTransporter.sendMail(mailOptions);

      if (this.isNodemailerOnTestMode) {
        // TODO: maybe have like a global logger somehow.
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(response));
      }

      await this.eventManager.emit(
        new EmailSentEvent({
          emailTemplate,
          mailOptions,
          response,
        })
      );

      return response;
    }
  }

  /**
   * Extends email to render its component to html
   * @param email
   */
  protected renderEmail(emailTemplate: IEmailSendingTemplateConfig): string {
    return renderToStaticMarkup(
      React.createElement(emailTemplate.component, emailTemplate.props)
    );
  }

  /**
   * This method is used to apply the defaults specified in the bundle configuration
   */
  protected applyDefaults(
    emailTemplate: IEmailSendingTemplateConfig,
    mailOptions: MailOptions
  ) {
    if (!mailOptions.from) {
      mailOptions.from = this.emailDefaults.from;
    }
    if (!emailTemplate.props) {
      emailTemplate.props = {};
    }
    if (this.emailDefaults.props) {
      emailTemplate.props = Object.assign(
        {},
        this.emailDefaults.props,
        emailTemplate.props
      );
    }
  }
}
