import * as X from "@bluelibs/x-bundle";
import { RegistrationInput } from "../inputs/RegistrationInput";
import { LoginInput } from "../inputs/LoginInput";
import { ResetPasswordInput } from "../inputs/ResetPasswordInput";
import { ForgotPasswordInput } from "../inputs/ForgotPasswordInput";
import { VerifyEmailInput } from "../inputs/VerifyEmailInput";
import { XPasswordService } from "../services/XPasswordService";
import { ChangePasswordInput } from "../inputs/ChangePasswordInput";
import { IXPasswordBundleConfig } from "../defs";
import {
  RequestLoginLinkInput,
  VerifyMagicLinkInput,
} from "../inputs/RequestMagicLinkInput";

export default (config: IXPasswordBundleConfig) => {
  const {
    graphql: { mutations },
  } = config;

  const resolvers: any = {};

  if (mutations.register) {
    resolvers.register = [
      X.ToModel(RegistrationInput),
      X.Validate(),
      X.ToService(XPasswordService, "register"),
    ];
  }

  if (mutations.changePassword) {
    resolvers.changePassword = [
      X.CheckLoggedIn(),
      X.ToModel(ChangePasswordInput),
      X.Validate(),
      X.ToService(XPasswordService, "changePassword"),
    ];
  }

  if (mutations.login) {
    resolvers.login = [
      X.ToModel(LoginInput),
      X.Validate(),
      X.ToService(XPasswordService, "login"),
    ];
  }

  if (mutations.logout) {
    resolvers.logout = [
      X.CheckLoggedIn(),
      X.ToService(XPasswordService, "logout", (args, ctx, any) => {
        return [ctx.authenticationToken];
      }),
    ];
  }

  if (mutations.resetPassword) {
    resolvers.resetPassword = [
      X.ToModel(ResetPasswordInput),
      X.Validate(),
      X.ToService(XPasswordService, "resetPassword"),
    ];
  }

  if (mutations.forgotPassword) {
    resolvers.forgotPassword = [
      X.ToModel(ForgotPasswordInput),
      X.Validate(),
      X.ToService(XPasswordService, "forgotPassword"),
    ];
  }

  if (mutations.verifyEmail) {
    resolvers.verifyEmail = [
      X.ToModel(VerifyEmailInput),
      X.Validate(),
      X.ToService(XPasswordService, "verifyEmail"),
    ];
  }

  if (mutations.requestLoginLink) {
    resolvers.requestLoginLink = [
      X.ToModel(RequestLoginLinkInput),
      X.Validate(),
      X.ToService(XPasswordService, "requestLoginLink"),
    ];
  }
  if (mutations.verifyMagicCode) {
    resolvers.verifyMagicCode = [
      X.ToModel(VerifyMagicLinkInput),
      X.Validate(),
      X.ToService(XPasswordService, "verifyMagicCode"),
    ];
  }

  return {
    Mutation: resolvers,
  };
};
