import {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegistrationInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from "../inputs";
import {
  RequestLoginLinkInput,
  VerifyMagicLinkInput,
} from "../inputs/RequestMagicLinkInput";
import * as X from "@bluelibs/x-bundle";

export const REST_APIS: {
  name: string;
  type: "post" | "get" | "put" | "patch" | "delete" | "all";
  path: string;
  service?: string;
  inputType?: any;
  handler?: (container, req, res, next) => any;
}[] = [
  {
    name: "register",
    type: "post",
    path: "/register",
    service: "register",
    inputType: RegistrationInput,
  },
  {
    name: "changePassword",
    type: "patch",
    path: "/change-password",
    service: "changePassword",
    inputType: ChangePasswordInput,
  },
  {
    name: "login",
    type: "post",
    path: "/",
    service: "login",
    inputType: LoginInput,
  },
  {
    name: "logout",
    type: "post",
    path: "/logout",
    service: "logout",
  },
  {
    name: "resetPassword",
    type: "post",
    path: "/reset-password",
    service: "resetPassword",
    inputType: ResetPasswordInput,
  },
  {
    name: "forgotPassword",
    type: "post",
    path: "/forgot-password",
    service: "forgotPassword",
    inputType: ForgotPasswordInput,
  },
  {
    name: "verifyEmail",
    type: "post",
    path: "/verify-email",
    service: "verifyEmail",
    inputType: VerifyEmailInput,
  },
  {
    name: "requestLoginLink",
    type: "post",
    path: "/request-login-link",
    service: "requestLoginLink",
    inputType: RequestLoginLinkInput,
  },
  {
    name: "verifyMagicCode",
    type: "post",
    path: "/verify-magic-code",
    service: "verifyMagicCode",
    inputType: VerifyMagicLinkInput,
  },
  {
    name: "me",
    type: "get",
    path: "/me",
    handler: async (container, req, res, next) => {
      try {
        await X.CheckLoggedIn();
      } catch (err) {
        console.log(err);
        res.json({ message: `something wen wrong! with route me` });
      }
    },
  },
];
