import {
  socialArrayPropsTypes,
  socialCustomConfigMapType,
  socialPropsTypes,
} from "./defs";

export const SOCIAL_CUSTOM_CONFIG: socialCustomConfigMapType = {
  twitter: {
    varChanges: {
      clientID: "consumerKey",
      clientSecret: "consumerSecret",
    },
  },
  linkedin: {
    varChanges: {
      clientID: "consumerKey",
      clientSecret: "consumerSecret",
    },
  },
  apple: {
    varChanges: {
      clientID: "clientID",
      clientSecret: "keyID",
    },
    varAdd: ["teamID", "privateKeyLocation", "passReqToCallback"],
  },
};
export const SOCIAL_UNIQUE_IDS: socialPropsTypes = {
  facebook: "id",
  twitter: "id",
  instagram: "id",
  linkedin: "id",
  github: "id",
  google: "id",
  amazon: "id",
  dropbox: "id",
  apple: "id",
};
export const STRATEGY_NAME_MAP: socialPropsTypes = {
  dropbox: "dropbox-oauth2",
};
export const IMPORT_STRATEGY_MAP: socialPropsTypes = {
  facebook: "passport-facebook",
  twitter: "passport-twitter",
  google: "passport-google-oauth20",
  github: "passport-github",
  linkedin: "passport-linkedin",
  instagram: "passport-instagram",
  amazon: "passport-amazon",
  dropbox: "passport-dropbox-oauth2",
  apple: "passport-apple",
};

export const FIELD_FETCH_VALUES: socialArrayPropsTypes = {
  email: ["email", "emails", "username"],
  firstName: ["givenName", "firstName", "given_Name", "first_name"],
  lastName: ["familyName", "lastName", "family_Name", "last_name"],
  fullName: ["full_name", "fullName", "name"],
  username: ["email", "emails", "username", "phoneNumber", "phone"],
  picture: ["picture", "pictures"],
};

export const PROFILE_OBJECT_PATH: socialArrayPropsTypes = {
  instagram: ["_json", "data"],
  default: ["_json"],
};
