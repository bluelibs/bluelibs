import * as React from "react";
import { EventManager, Inject, Event } from "@bluelibs/core";
import { ApolloError, gql } from "@apollo/client";
import { Smart } from "@bluelibs/smart";
import { LOCAL_STORAGE_TOKEN_KEY } from "../../constants";
import { ApolloClient } from "../../graphql/ApolloClient";
import { UserLoggedOutEvent } from "../../events/UserSecurityEvents";
import {
  UserLoggedInEvent,
  AuthenticationTokenUpdateEvent,
} from "../../events";

type State<UserType = GuardianUserType> = {
  /**
   * This represents the fact that we're currently fetching for the user data
   */
  fetchingUserData: boolean;
  /**
   * This marks if the user is successfully marked as logged in
   */
  isLoggedIn: boolean;
  /**
   * When the user has an expired token or one that couldn't retrieve the user
   */
  hasInvalidToken: boolean;
  user: UserType;
  /**
   * This is done the first time when the token is read and user is fetched. After that it will stay initialised.
   */
  initialised: boolean;
};

const GuardianContext = React.createContext(null);

interface IUserMandatory {
  _id: string | object | number;
  roles: string[];
}

export type GuardianUserType = {
  _id: string | object | number;
  profile: {
    firstName: string;
    lastName: string;
  };
  fullName: string;
  roles: string[];
  email: string;
};

export type GuardianUserRegistrationType = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export class GuardianSmart<
  TUserType extends IUserMandatory = GuardianUserType,
  TUserRegistrationType = GuardianUserRegistrationType
> extends Smart<State<TUserType>, any> {
  protected authenticationToken: string;

  state: State<TUserType> = {
    fetchingUserData: false,
    isLoggedIn: false,
    hasInvalidToken: false,
    user: null,
    initialised: false,
  };

  @Inject()
  apolloClient: ApolloClient;

  @Inject()
  eventManager: EventManager;

  async init() {
    return this.load()
      .then(() => {
        this.updateState({
          initialised: true,
        });
      })
      .catch(() => {
        this.updateState({
          initialised: true,
        });
      });
  }

  protected async load() {
    await this.retrieveToken();

    if (!this.authenticationToken) {
      // Nothing to do without a token
      return;
    }

    this.updateState({
      fetchingUserData: true,
    });
    if (this.authenticationToken) {
      this.updateState({ fetchingUserData: true });

      return this.retrieveUser()
        .then((user) => {
          this.updateState({
            user,
            isLoggedIn: true,
            hasInvalidToken: false,
            fetchingUserData: false,
          });
        })
        .catch((err) => {
          return this.handleUserRetrievalError(err);
        });
    }
  }

  protected handleUserRetrievalError(err) {
    console.error(
      `[Authentication] There was an error fetching the user: ${err.toString()}`
    );

    // I am very sorry it is like this, we should improve the erroring mechanism somehow
    const errors = err.networkError?.result?.errors;
    if (errors && errors[0] && errors[0].code) {
      if (["SESSION_TOKEN_EXPIRED", "INVALID_TOKEN"].includes(errors[0].code)) {
        console.warn("[Authentication] Token was invalid or expired");
        // We need to log him out
        this.storeToken(null);
        this.updateState({
          hasInvalidToken: true,
          fetchingUserData: false,
          isLoggedIn: false,
        });
      }
    }

    // There might be some other error, like the API is down, no reason to log him out
    this.updateState({ fetchingUserData: false });
  }

  protected retrieveUser(): Promise<TUserType> {
    return this.apolloClient
      .query({
        query: gql`
          query me {
            me {
              _id
              email
              profile {
                firstName
                lastName
              }
              roles
            }
          }
        `,
        fetchPolicy: "network-only",
      })
      .then((response) => {
        return response.data.me;
      });
  }

  protected async retrieveToken() {
    this.authenticationToken =
      localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY) || null;
    await this.eventManager.emit(
      new AuthenticationTokenUpdateEvent({ token: this.authenticationToken })
    );
  }

  protected async storeToken(token: string | null) {
    await this.eventManager.emit(new AuthenticationTokenUpdateEvent({ token }));

    if (token === null) {
      localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
    } else {
      localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, token);
    }
  }

  getToken() {
    return this.authenticationToken;
  }

  async login(username: string, password: string) {
    this.updateState({
      hasInvalidToken: false,
    });
    await this.storeToken(null);

    return this.apolloClient
      .mutate({
        mutation: gql`
          mutation login($input: LoginInput!) {
            login(input: $input) {
              token
            }
          }
        `,
        variables: {
          input: {
            username,
            password,
          },
        },
      })
      .then(async (response) => {
        const { token } = response.data.login;
        await this.eventManager.emit(new UserLoggedInEvent({ token }));

        // We await this as storing the token might be blocking
        await this.storeToken(token);
        await this.load();

        return token;
      });
  }

  /**
   * Registers and returns the token if the user isn't required to verify the email first
   * @param user
   */
  register(user: TUserRegistrationType): Promise<string | null> {
    return this.apolloClient
      .mutate({
        mutation: gql`
          mutation register($input: RegistrationInput!) {
            register(input: $input) {
              token
            }
          }
        `,
        variables: {
          input: user,
        },
      })
      .then((response) => {
        const { token } = response.data.register;
        if (token) {
          this.storeToken(token);
        }

        return token;
      });
  }

  verifyEmail(emailToken: string): Promise<string> {
    return this.apolloClient
      .mutate({
        mutation: gql`
          mutation verifyEmail($input: VerifyEmailInput!) {
            verifyEmail(input: $input) {
              token
            }
          }
        `,
        variables: {
          input: {
            token: emailToken,
          },
        },
      })
      .then(async (response) => {
        const { token } = response.data.verifyEmail;
        await this.storeToken(token);

        return token;
      });
  }

  forgotPassword(email: string): Promise<void> {
    return this.apolloClient
      .mutate({
        mutation: gql`
          mutation forgotPassword($input: ForgotPasswordInput!) {
            forgotPassword(input: $input)
          }
        `,
        variables: {
          input: {
            email,
          },
        },
      })
      .then((response) => {
        return;
      });
  }

  resetPassword(
    username: string,
    token: string,
    newPassword: string
  ): Promise<string> {
    return this.apolloClient
      .mutate({
        mutation: gql`
          mutation resetPassword($input: ResetPasswordInput!) {
            resetPassword(input: $input) {
              token
            }
          }
        `,
        variables: {
          input: {
            username,
            token,
            newPassword,
          },
        },
      })
      .then((response) => {
        const { token } = response.data.resetPassword;
        this.storeToken(token);

        return token;
      });
  }

  /**
   * Changes the password of the current user
   * @param oldPassword
   * @param newPassword
   */
  changePassword(oldPassword: string, newPassword: string): Promise<void> {
    return this.apolloClient
      .mutate({
        mutation: gql`
          mutation changePassword($input: ChangePasswordInput!) {
            changePassword(input: $input)
          }
        `,
        variables: {
          input: {
            oldPassword,
            newPassword,
          },
        },
      })
      .then((response) => {
        return;
      });
  }

  /**
   * Logs the user out and cleans up the tokens
   */
  logout(): Promise<void> {
    return this.apolloClient
      .mutate({
        mutation: gql`
          mutation logout {
            logout
          }
        `,
      })
      .then(async () => {
        const { _id } = this.state.user;
        await this.eventManager.emit(
          new UserLoggedOutEvent({
            userId: _id,
          })
        );
        await this.storeToken(null);
        this.updateState({
          isLoggedIn: false,
          user: null,
          fetchingUserData: false,
        });
        return;
      });
  }

  hasRole(role: string | string[]): boolean {
    const currentRoles = this.state.user?.roles;
    if (!currentRoles) {
      return false;
    }

    if (Array.isArray(role)) {
      return role.some((_role) => currentRoles.includes(_role));
    }

    return currentRoles.includes(role);
  }

  static getContext() {
    return GuardianContext;
  }
}
