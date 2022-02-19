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
import { IRequestMagicLinkProps } from "./emails/RequestMagicLink";
import {
  socialArrayPropsTypes,
  socialCustomConfigMapType,
  socialPropsTypes,
  SocialServiceConfigType,
  SOCIAL_LOGIN_TYPE,
} from "./social-passport/defs";
import { SocialLoginService } from "./social-passport/SocialLoginService";
import { UserId } from "@bluelibs/security-bundle";
import { MultipleFactorService } from "./multipleAuthFactor/MultipleFactorService";
import { IMultipleFactorService } from "./multipleAuthFactor/IMultipleFactorService";

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
    SocialLoginService: Constructor<SocialLoginService>;
    MultipleFactorService: Constructor<IMultipleFactorService>;
  };
  emails: {
    templates: {
      welcome: IReactEmailTemplate<IWelcomeEmailProps>;
      forgotPassword: IReactEmailTemplate<IForgotPasswordEmailProps>;
      resetPasswordConfirmation: IReactEmailTemplate<IResetPasswordConfirmationEmailProps>;
      verifyEmail: IReactEmailTemplate<IVerifyEmailProps>;
      requestMagicLink?: IReactEmailTemplate<IRequestMagicLinkProps>;
    };
    paths: {
      welcomePath: string;
      resetPasswordPath: string;
      verifyEmailPath: string;
      submitMagicCode?: string;
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
      requestLoginLink: boolean;
      verifyMagicCode: boolean;
    };
    queries: {
      me: boolean;
    };
  };
  rest?: {
    register?: boolean;
    changePassword?: boolean;
    login?: boolean;
    logout?: boolean;
    resetPassword?: boolean;
    forgotPassword?: boolean;
    verifyEmail?: boolean;
    requestLoginLink?: boolean;
    verifyMagicCode?: boolean;
    me?: boolean;
  };
  socialAuth?: {
    services?: {
      [key: SOCIAL_LOGIN_TYPE]: SocialServiceConfigType;
    };
    onSocialAuth?: (
      req,
      type,
      uniqueProperty,
      accessToken,
      refreshToken,
      profile,
      done
    ) => any;
    url: string;
    socialUniqueIds?: socialPropsTypes;
    strategyNameMap?: socialPropsTypes;
    socialCustomConfig?: socialCustomConfigMapType;
    importStrategyMap?: {
      [key: string]: string;
    };
    fieldsValues?: socialArrayPropsTypes;
    profileObjectPath?: socialArrayPropsTypes;
  };

  multipleFactorAuth?: {
    factors: { strategy: string; redirectUrl: string }[];
    userHaveToMultipleFactorAuth?: (userId: UserId) => Promise<boolean>;
  };

  magicCodeLifeDuration?: string;
  magicAuthFormat?: "token" | "code" | "qrCode";
  leftSubmissionsCount?: number;
}
