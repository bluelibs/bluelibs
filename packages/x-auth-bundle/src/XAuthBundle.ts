import { Bundle } from "@bluelibs/core";
import { Loader } from "@bluelibs/graphql-bundle";
import { SecurityBundle } from "@bluelibs/security-bundle";
import { PasswordBundle } from "@bluelibs/password-bundle";
import { HTTPBundle } from "@bluelibs/http-bundle";

import { IXAuthBundleConfig } from "./defs";
import {
  AUTH_CODE_COLLECTION_TOKEN,
  MAGIC_AUTH_STRATEGY,
  MULTIPLE_FACTORS_AUTH,
  PASSWORD_STRATEGY,
  SOCIAL_AUTH_SERVICE_TOKEN,
  X_AUTH_SETTINGS,
} from "./constants";
import { createGraphQLModule } from "./graphql";
import { XAuthService } from "./services/XAuthService";
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
import { AuthenticationCodesCollection } from "./collections/AuthenticationCodes.collection";

export class XAuthBundle extends Bundle<IXAuthBundleConfig> {
  dependencies = [PasswordBundle, SecurityBundle];

  protected defaultConfig: Partial<IXAuthBundleConfig> = {
    services: {
      XAuthService,
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
    /*
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
     multipleFactorAuth: {
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
    this.container.set(X_AUTH_SETTINGS, this.config);
    this.container.set({
      id: AUTH_CODE_COLLECTION_TOKEN,
      type: AuthenticationCodesCollection,
    });
    if (this.config.services?.MultipleFactorService) {
      this.container.set({
        id: MULTIPLE_FACTORS_AUTH,
        type: this.config.services?.MultipleFactorService,
      });
      this.container.get(MULTIPLE_FACTORS_AUTH);
    }
    // Override password service if necessary
    if (this.config.services?.XAuthService) {
      this.container.set({
        id: XAuthService,
        type: this.config.services.XAuthService,
      });
    }
  }

  async init() {
    const graphqlModule = createGraphQLModule(this.config);
    const loader = this.container.get<Loader>(Loader);
    loader.load(graphqlModule);
    if (this.config?.rest) {
      const httpBundle = this.container.get<HTTPBundle>(HTTPBundle);
      injectRestAuthRoutes(this.config, httpBundle);
    }

    // Ensure it's initialised and ready to serve
    this.container.get(XAuthService);
    //social login
    if (this.config.socialAuth && this.config.services?.SocialLoginService) {
      this.container.set({
        id: SOCIAL_AUTH_SERVICE_TOKEN,
        type: this.config.services.SocialLoginService,
      });
      this.container.get(SOCIAL_AUTH_SERVICE_TOKEN);
    }
  }
}
