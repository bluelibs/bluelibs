import { Bundle, BundlePhase } from "@bluelibs/core";
import { IEmailBundleConfig, ConfigTransporterType } from "./defs";
import {
  NODEMAILER_INSTANCE,
  NODEMAILER_TEST_MODE,
  EMAIL_DEFAULTS,
} from "./constants";
import * as nodemailer from "nodemailer";
import { LoggerService, LoggerBundle } from "@bluelibs/logger-bundle";
import { ConsoleTransporter } from "./services/ConsoleTransporter";

export class EmailBundle extends Bundle<IEmailBundleConfig> {
  dependencies = [LoggerBundle];

  protected defaultConfig: IEmailBundleConfig = {
    transporter: "console",
    defaults: {
      from: `"BlueLibs" <no-reply@bluelibs.org>`,
      props: {},
    },
  };

  async prepare() {
    let { transporter } = this.config;

    if (transporter === null) {
      this.container.set(NODEMAILER_INSTANCE, null);
    } else {
      this.container.set(
        NODEMAILER_INSTANCE,
        nodemailer.createTransport(await this.getTransporter(transporter))
      );
    }

    this.container.set(NODEMAILER_TEST_MODE, false);

    this.container.set(EMAIL_DEFAULTS, this.config.defaults);
  }

  private async getTransporter(transporter: string | ConfigTransporterType) {
    if (transporter === "console") {
      return ConsoleTransporter;
    }

    const logger = this.container.get(LoggerService);

    if (transporter === "nodemailer-test") {
      try {
        logger.info("Creating email test account");
        transporter = await this.getTestAccountInfo();
        this.container.set(NODEMAILER_TEST_MODE, true);

        return transporter;
      } catch (err) {
        logger.warning(
          `We could not create a nodemailer test account. All emails will be logged in console.`
        );

        return ConsoleTransporter;
      }
    }

    return transporter;
  }

  async getTestAccountInfo() {
    const testAccount = await nodemailer.createTestAccount();
    return {
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    };
  }

  /**
   * Set the transporter before preparation of the bundle
   *
   * @param transporter
   */
  setTransporter(transporter) {
    if (this.phase === BundlePhase.BEFORE_PREPARATION) {
      this.updateConfig({
        transporter,
      });
    } else {
      throw new Error(
        "Please modify the transporter in the BundleBeforePrepareEvent"
      );
    }
  }
}
