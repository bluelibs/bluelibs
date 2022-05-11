import { Bundle } from "@bluelibs/core";
import { Loader } from "@bluelibs/graphql-bundle";
import { SecurityBundle } from "@bluelibs/security-bundle";
import { PasswordBundle } from "@bluelibs/password-bundle";
import { HTTPBundle } from "@bluelibs/http-bundle";

import { IXPasswordBundleConfig } from "./defs";
import {
  MAGIC_AUTH_STRATEGY,
  MULTIPLE_FACTORS_AUTH,
  PASSWORD_STRATEGY,
  SOCIAL_AUTH_SERVICE_TOKEN,
  X_PASSWORD_SETTINGS,
} from "./constants";
import { createGraphQLModule } from "./graphql";
import { XPasswordService } from "./services/XPasswordService";
import { VerifyEmail } from "./emails/VerifyEmail";
import {
  ForgotPasswordEmail,
  ResetPasswordConfirmationEmail,
  WelcomeEmail,
} from "./emails";
import { RequestMagicLink } from "./emails/RequestMagicLink";
import { injectRestAuthRoutes } from "./restApis";
import { SocialLoginService } from "./social-passport/SocialLoginService";
import { MultipleFactorService } from "./multipleAuthFactor/MultipleFactorService";

export class XPasswordBundle extends Bundle<IXPasswordBundleConfig> {
  dependencies = [PasswordBundle, SecurityBundle, HTTPBundle];

  protected defaultConfig: Partial<IXPasswordBundleConfig> = {
    services: {
      XPasswordService,
      SocialLoginService,
      MultipleFactorService,
    },
    emails: {
      templates: {
        forgotPassword: ForgotPasswordEmail,
        resetPasswordConfirmation: ResetPasswordConfirmationEmail,
        welcome: WelcomeEmail,
        verifyEmail: VerifyEmail,
        requestMagicLink: RequestMagicLink,
      },
      paths: {
        welcomePath: "/login",
        resetPasswordPath: "/reset-password/:token",
        verifyEmailPath: "/verify-email/:token",
        submitMagicCode: "/submit-magic-link",
      },
      applicationName: "BlueLibs",
      regardsName: "BlueLibs Team",
      sendEmailVerification: true,
      sendWelcomeEmail: true,
    },
    requiresEmailVerificationBeforeLoggingIn: false,
    graphql: {
      mutations: {
        register: true,
        login: true,
        logout: true,
        changePassword: true,
        resetPassword: true,
        forgotPassword: true,
        verifyEmail: true,
        requestLoginLink: true,
        verifyMagicCode: true,
      },
      queries: {
        me: true,
      },
    },
    rest: {
      login: true,
      logout: true,
      register: true,
      changePassword: true,
      resetPassword: true,
      forgotPassword: true,
      verifyEmail: true,
      requestLoginLink: true,
      verifyMagicCode: true,
      me: true,
    },
    /* multipleFactorAuth: {
      factors: [
        {
          strategy: PASSWORD_STRATEGY,
          redirectUrl: "http://localhost:8080/login",
        },
        {
          strategy: MAGIC_AUTH_STRATEGY,
          redirectUrl: "http://localhost:8080/request-magic-link",
        },
      ],
    },*/
    magicCodeLifeDuration: "5m",
    magicAuthFormat: "code",
    leftSubmissionsCount: 3,
  };

  async prepare() {
    this.container.set(X_PASSWORD_SETTINGS, this.config);

    if (this.config.services?.MultipleFactorService) {
      this.container.set({
        id: MULTIPLE_FACTORS_AUTH,
        type: MultipleFactorService,
      });
      this.container.get(MULTIPLE_FACTORS_AUTH);
    }
    // Override password service if necessary
    if (this.config.services?.XPasswordService) {
      this.container.set({
        id: XPasswordService,
        type: this.config.services.XPasswordService,
      });
    }
  }

  async init() {
    const graphqlModule = createGraphQLModule(this.config);
    const loader = this.container.get<Loader>(Loader);
    loader.load(graphqlModule);
    const httpBundle = this.container.get<HTTPBundle>(HTTPBundle);
    injectRestAuthRoutes(this.config, httpBundle);

    // Ensure it's initialised and ready to serve
    this.container.get(XPasswordService);
    //social login
    if (this.config.socialAuth && this.config.services?.SocialLoginService) {
      this.container.set({
        id: SOCIAL_AUTH_SERVICE_TOKEN,
        type: SocialLoginService,
      });
      this.container.get(SOCIAL_AUTH_SERVICE_TOKEN);
    }
  }
}
