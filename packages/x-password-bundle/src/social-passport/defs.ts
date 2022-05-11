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

export type SocialServiceConfigType = {
  settings: {
    clientID: string;
    clientSecret: string;
    authParameters?: {
      scope?: string | string[];
      profileFields?: string | string[];
    };
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
    //those are for extra credentials keys used in some strategies
    extraCredentialsKeys?: string[];
  };
};

export type socialPropsTypes = { [key: string]: string };

export type socialArrayPropsTypes = {
  [key: string]: string[];
};
