import type passport from "passport";

export type SOCIAL_LOGIN_TYPE =
  | string
  | "facebook"
  | "google"
  | "twitter"
  | "instagram"
  | "github"
  | "linkedin"
  | "amazon"
  | "dropbox"
  | "apple";

/**
 * A generic OAuth/Passport profile. Known fields are typed, but strategies may
 * attach arbitrary extra properties, so we allow unknown keys.
 */
export interface SocialProfile {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  [key: string]: unknown;
}

/**
 * The callback Passport strategies invoke with the parsed OAuth profile.
 */
export type SocialVerifyFunction = (
  req: unknown,
  accessToken: string,
  refreshToken: string,
  profile: SocialProfile,
  done: (error: unknown, user?: unknown) => void
) => void;

export type SocialStrategyType = new (
  options: Record<string, unknown>,
  verify: SocialVerifyFunction
) => passport.Strategy;

/**
 * Application-level callback invoked with the authenticated social profile so
 * the bundle can look up or create the matching user and issue a token.
 */
export type SocialAuthCallback = (
  req: unknown,
  type: string,
  uniqueProperty: string,
  accessToken: string,
  refreshToken: string,
  profile: SocialProfile,
  done: (error: unknown, user?: unknown) => void
) => void | Promise<void>;

export type SocialServiceConfigType = {
  settings: {
    clientID: string;
    clientSecret: string;
    authParameters?: {
      scope?: string | string[];
      profileFields?: string | string[];
    };
    extraCredentials: Record<string, unknown>;
  };
  url: {
    auth: string;
    callback: string;
    success?: string;
    fail: string;
  };
};

export type socialCustomConfigMapType = {
  [key: string]: {
    //here we define the client id and secret keys used in the passport strategy
    credentialsKeys: {
      clientID: string;
      clientSecret: string;
    };
    //those are for extra credentials keys used in some strategies;
    //either a function per extra option, or the raw list of option names
    extraCredentialsKeys?:
      string[] | Record<string, (setting: SocialServiceConfigType) => unknown>;
  };
};

export type socialPropsTypes = { [key: string]: string };

export type socialArrayPropsTypes = {
  [key: string]: string[];
};
