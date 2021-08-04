import * as React from "react";
import { EmailService } from "../services/EmailService";
import { EventManager } from "@bluelibs/core";
import { Transporter } from "nodemailer";
import { ITransporter, IReactEmailTemplate } from "../defs";
import { MailOptions } from "nodemailer/lib/smtp-transport";
import { createEcosystem } from "./createEcosystem";

describe("EmailService", () => {
  test("Should be able to render an email and reach the transport", async () => {
    const eventManager = new EventManager();
    let emailSent = false;
    const to = "johnas@smith.com";
    const transporter: ITransporter = {
      async sendMail(mailOptions: MailOptions) {
        expect(
          mailOptions.html.toString().indexOf("Hello friend, Johnas") === 0
        ).toBe(true);
        expect(mailOptions.to).toEqual(to);
        emailSent = true;
      },
    };

    const service = new EmailService(transporter, false, {}, eventManager);

    interface IProps {
      name: string;
    }

    const Component: IReactEmailTemplate<IProps> = (props) => {
      return <>Hello friend, {props.name}</>;
    };

    Component.subject = (props) => {
      return "x";
    };

    await service.send<IProps>(
      {
        component: Component,
        props: {
          name: "Johnas",
        },
      },
      {
        to: to,
      }
    );

    expect(emailSent).toBe(true);
  });

  test("Should be able to properly apply the defaults specified", () => {
    // TODO:
  });

  test("Should send an email via console logger", async () => {
    const container = await createEcosystem({
      transporter: "console",
    });

    const emailService = container.get(EmailService);
    await emailService.send(
      {
        component: () => {
          return <h1>Hello!</h1>;
        },
      },
      {
        to: "theo@google.com",
        subject: "Hello world!",
      }
    );

    // Previously the promise did not resolve so we just want to make sure that sending by console works
    expect(true).toBe(true);
  });
});
