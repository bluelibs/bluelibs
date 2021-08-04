import { IRoute } from "@bluelibs/x-ui";
import { Login } from "./Login";
import { Register } from "./Register";
import { VerifyEmail } from "./VerifyEmail";
import { ForgotPassword } from "./ForgotPassword";
import { ResetPassword } from "./ResetPassword";
import { ChangePassword } from "./ChangePassword";

export const LOGIN: IRoute = {
  path: "/login",
  component: Login,
};

export const REGISTER: IRoute = {
  path: "/register",
  component: Register,
};

export const VERIFY_EMAIL: IRoute<{ token: string }> = {
  path: "/verify-email/:token",
  component: VerifyEmail,
};

export const FORGOT_PASSWORD: IRoute = {
  path: "/forgot-password",
  component: ForgotPassword,
};

export const RESET_PASSWORD: IRoute<{ token: string }> = {
  path: "/reset-password/:token",
  component: ResetPassword,
};

export const CHANGE_PASSWORD: IRoute = {
  path: "/change-password",
  component: ChangePassword,
};
