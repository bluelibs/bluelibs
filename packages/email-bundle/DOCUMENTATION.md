## Purpose

We want to send templated emails to our customers. So we decided to have a neat way to integrate React on the server which can render the emails for us, enjoying TypeSafety but also ability to have responsive emails.

## Install

```bash
npm install react react-dom @bluelibs/email-bundle @bluelibs/logger-bundle
```

```ts
import { EmailBundle } from "@bluelibs/email-bundle";

const kernel = new Kernel({
  bundles: [
    new LoggerBundle({ console: true }),
    new EmailBundle({ transporter: "console" }),
  ],
});
```

## Config

```typescript
// The config interface

export interface IEmailBundleConfig {
  /**
   * If you don't pass a transporter, a test transporter will be
   * created with nodemailer (allowing you view your emails online without any SMTP).
   * If the test transporter cannot be created, it will default to console
   */
  transporter?:
    | "console" // Will console log the email data
    | "nodemailer-test" // Will generate a Preview URL using nodemailer test accounts
    | {
        // Or simply use SMTP
        host: string;
        port: number;
        secure?: boolean;
        auth?: {
          user: string;
          pass: string;
        };
      };
  defaults: {
    from?: string;
    /**
     * Inject global properties
     */
    props?: any;
  };
}
```

## HTTP Transport

You can use it by either providing your own custom transport, you can customise this heavily. A common example would be to use Mailgun HTTP API to send emails:

```typescript
import * as mg from "nodemailer-mailgun-transport";

kernel.addBundle(
  new EmailBundle({
    transporter: mg({
      auth: {
        api_key: "xxx",
        domain: "mydomain.com",
      },
    }),
  })
);
```

Read more on custom transports here:

- https://nodemailer.com/transports/
- https://nodemailer.com/plugins/create/#transports

And if you want to have a registered, service-dependency container that creates the transport inside your bundle, then, in the `hook()` phase, listen to `BundleBeforePrepareEvent` and `setTransporter()` with your own custom transport solution. Same logic would apply if you want to extend the global props (props that reach any email template).

## Templates

Let's create an email template:

```typescript
// https://nodemailer.com/about/
const emailService = container.get(EmailService);

export interface IWelcomeEmailProps {
  name: string;
}

// To send your email is easy
export function WelcomeEmail(props: IWelcomeEmailProps) {
  return <div>Hello {props.name}</div>;
}

// Subject is most of the time very tied to the email template
// You can omit this if you are sending the "subject" in the message configuration
WelcomeEmail.subject = (props: IWelcomeEmailProps) => `Hello ${props.name}`;
```

Now let's try to send an email:

```typescript
// The send argument IWelcomeEmailProps is optional, but it does help you ensure the props is correctly sent
await emailService.send<IWelcomeEmailProps>(
  // Template options
  {
    component: WelcomeEmail,
    props: {
      name: "Theodor",
    },
  },
  // This argument represents the message configuration
  // Explore more about it here: https://nodemailer.com/message/
  {
    to: "someone@somewhere.com",
  }
);
```

## Responsive Emails

You can use https://mjml.io/ to benefit of nicely rendered emails.

```bash
npm install mjml
```

Let's hook into it right before sending so we can transform our html:

```typescript
import { Listener, On } from "@bluelibs/core";
import * as mjml2html from "mjml";

class EmailListener extends Listener {
  @On(EmailBeforeSendEvent)
  transformMjml(event: EmailBeforeSendEvent) {
    const { html } = event.data.mailOptions;
    event.data.mailOptions.html = mjml2html(html);
  }
}
```

Another alternative would be to use the react version of it: https://github.com/wix-incubator/mjml-react and bypass the need of a listener.

## Global Variables

Following the same pattern as above, you can listen to emails before they get rendered via `EmailBeforeRenderEvent` and inject a variable such as "applicationUrl" or a router:

```ts
class EmailListener extends Listener {
  @On(EmailBeforeRenderEvent)
  extendProps(event: EmailBeforeRenderEvent) {
    const { emailTemplate } = event.data;

    Object.assign(emailTemplate.props, {
      appUrl: "http://www.google.com",
    });
  }
}
```

And you can have a sort of "master" interface for these global props:

```ts
// Example. This will be accessible from all React email templates, as long with their defined properties.
declare module "@bluelibs/email-bundle" {
  export interface IGlobalEmailProps {
    appUrl: "https://abc.com";
  }
}

export interface IWelcomeEmailProps {
  name: string;
}
```

## Fully Customised Emails

It is also a common use-case where you send emails through a provider which lets you customize them visually. This means that you send a "key" which identifies the email, and some "props". No longer needing React templates.

To do this, implement your custom email service:

```ts
import { Service } from "@bluelibs/core";

@Service()
export class AppEmailService {
  // inject the things you want and do it how you like
  async send(mailInfo) {
    // Do send the email here.
  }
}
```

You can opt-out of sending emails completely, but still benefit of the Bundles sending emails for `Password Recovery` for example, you can hook into the event and make it send your own templates in your own way.

```ts
new EmailBundle({
  transporter: null,
});
```

```ts
import { EmailBeforeSendEvent } from "@bluelibs/core";

eventManager.addListener(EmailBeforeSendEvent, async (e) => {
  const {
    emailTemplate: { component, props },
    mailOptions,
  } = e.data;

  if (component.name === "RecoveryPassword") {
    // Match somehow the template name with the component type
    // Bundles should export their email components so you can safely do the comparison
  }

  // You now have to map the component, to a string of your choice and voila!
  appEmailService.send("TEMPLATE", props);
});
```

## Meta

### Summary

We use this bundle to send emails with react, have them responsive, fully flexible transport, cool testing without needing smtps like console printing options and full capability to opt-out.

### Boilerplates

- [Emails](https://stackblitz.com/edit/node-anvty2?file=README.md)

### Challenges

- Send yourself an email congratulating yourself on the fact that were able to send an email. (1p)
