import { i18n } from "@bundles/UIAppBundle/i18n";
import AuthenticationMessages from "./Authentication.i18n.json";

import { IRoute } from "@bluelibs/x-ui";
import { Login } from "./Login/Login";
import { Register } from "./Register/Register";
import { VerifyEmail } from "./VerifyEmail/VerifyEmail";
import { ForgotPassword } from "./ForgotPassword/ForgotPassword";
import { ResetPassword } from "./ResetPassword/ResetPassword";
import { ChangePassword } from "./ChangePassword/ChangePassword";
import { RequestMagicLink } from "./MagicLink/RequestMagicLink";
import { SubmitMagicLink } from "./MagicLink/SubmitMagicLink";
import { SocialAuth } from "./SocialAuth/SocialAuth";

i18n.push(AuthenticationMessages);

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

export const REQUEST_MAGIC_LINK: IRoute = {
  path: "/request-magic-link",
  component: RequestMagicLink,
};
export const SUBMIT_MAGIC_LINK: IRoute = {
  path: "/submit-magic-link",
  component: SubmitMagicLink,
};
export const SOCIAL_AUTH_LINK: IRoute = {
  path: "/auth/social",
  component: SocialAuth,
};
