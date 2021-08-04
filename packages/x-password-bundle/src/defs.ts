import { IReactEmailTemplate } from "@bluelibs/email-bundle";
import { IXPasswordService } from "./services/IXPasswordService";
import { Constructor } from "@bluelibs/core";
import { IForgotPasswordEmailProps } from "./emails/ForgotPasswordEmail";
import { IWelcomeEmailProps } from "./emails/WelcomeEmail";
import { IResetPasswordConfirmationEmailProps } from "./emails";
import { IVerifyEmailProps } from "./emails/VerifyEmail";
import "@bluelibs/security-bundle";
import "@bluelibs/password-bundle";
import { IPasswordAuthenticationStrategy } from "@bluelibs/password-bundle";

declare module "@bluelibs/security-bundle" {
  export interface IUser {
    password: IPasswordAuthenticationStrategy;
    profile: IUserProfile;
  }
  export interface IUserProfile {
    firstName: string;
    lastName: string;
  }
}

export interface IXPasswordBundleConfig {
  services: {
    XPasswordService: Constructor<IXPasswordService>;
  };
  emails: {
    templates: {
      welcome: IReactEmailTemplate<IWelcomeEmailProps>;
      forgotPassword: IReactEmailTemplate<IForgotPasswordEmailProps>;
      resetPasswordConfirmation: IReactEmailTemplate<IResetPasswordConfirmationEmailProps>;
      verifyEmail: IReactEmailTemplate<IVerifyEmailProps>;
    };
    paths: {
      welcomePath: string;
      resetPasswordPath: string;
      verifyEmailPath: string;
    };
    applicationName: string;
    regardsName: string;
    sendEmailVerification: boolean;
    sendWelcomeEmail: boolean;
  };
  requiresEmailVerificationBeforeLoggingIn: boolean;
  graphql: {
    mutations: {
      register: boolean;
      changePassword: boolean;
      login: boolean;
      logout: boolean;
      resetPassword: boolean;
      forgotPassword: boolean;
      verifyEmail: boolean;
    };
    queries: {
      me: boolean;
    };
  };
}
