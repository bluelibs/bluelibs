import { Listener, On, Inject } from "@bluelibs/core";
import { EmailService } from "@bluelibs/email-bundle";
import {
  PasswordResetRequestedEvent,
  PasswordService,
} from "@bluelibs/password-bundle";
import { ForgotPasswordEmail } from "../emails/ForgotPasswordEmail";
import { X_AUTH_SETTINGS } from "../constants";
import { IXAuthBundleConfig } from "../defs";
import { Router } from "@bluelibs/x-bundle";
import { SecurityService } from "@bluelibs/security-bundle";
import "@bluelibs/password-bundle";

export class EmailListener extends Listener {
  @Inject(() => Router)
  router: Router;

  @Inject(() => PasswordService)
  passwordService: PasswordService;

  @Inject(() => SecurityService)
  securityService: SecurityService;

  @Inject(X_AUTH_SETTINGS)
  settings: IXAuthBundleConfig;

  @On(PasswordResetRequestedEvent)
  async onPasswordReset(event: PasswordResetRequestedEvent) {
    const emailService = this.get<EmailService>(EmailService);

    const { userId, token } = event.data;
    const { paths } = this.settings.emails;
    const { name, email } = await this.getUserData(userId);

    emailService.send(
      {
        component: ForgotPasswordEmail,
        props: {
          resetPasswordUrl: this.router.path(paths.resetPasswordPath, {
            token,
          }),
          name,
          username: email,
          regardsName: this.settings.emails.regardsName,
        },
      },
      {
        to: email,
      }
    );
  }

  protected async getUserData(userId): Promise<{
    name: string;
    email: string;
  }> {
    const user = await this.securityService.findUserById(userId);

    return {
      name: user.profile?.firstName,
      email: user.password?.username,
    };
  }
}
