import { IXPasswordBundleConfig } from "../defs";

function mutation(type: string, mutationLine: string, others: string = "") {
  return (type +=
    "\n type Mutation {\n" + mutationLine + "\n }\n" + others + "\n");
}

export default (config: IXPasswordBundleConfig) => {
  const {
    graphql: { mutations },
  } = config;

  let output = "";

  if (mutations.register) {
    output = mutation(
      output,
      /* GraphQL */ `register(input: RegistrationInput!): RegistrationResponse!`,
      /* GraphQL */ `
        input RegistrationInput {
          firstName: String!
          lastName: String!
          email: String!
          password: String!
        }

        type RegistrationResponse {
          """
          Please not that if the user is required to validate his email for logging in, token will be null
          """
          token: String
        }
      `
    );
  }
  if (mutations.changePassword) {
    output = mutation(
      output,
      /* GraphQL */ `changePassword(input: ChangePasswordInput!): Boolean`,
      /* GraphQL */ `
        input ChangePasswordInput {
          oldPassword: String!
          newPassword: String!
        }
      `
    );
  }

  if (mutations.login) {
    output = mutation(
      output,
      /* GraphQL */ `login(input: LoginInput!): LoginResponse!`,
      /* GraphQL */ `
        input LoginInput {
          username: String!
          password: String!
        }
        type LoginResponse {
          token: String!
        }
      `
    );
  }
  if (mutations.logout) {
    output = mutation(output, /* GraphQL */ `logout: Boolean`);
  }
  if (mutations.resetPassword) {
    output = mutation(
      output,
      /* GraphQL */ `resetPassword(input: ResetPasswordInput!): ResetPasswordResponse!`,
      /* GraphQL */ `
        input ResetPasswordInput {
          username: String!
          token: String!
          newPassword: String!
        }

        type ResetPasswordResponse {
          token: String!
        }
      `
    );
  }
  if (mutations.forgotPassword) {
    output = mutation(
      output,
      /* GraphQL */ `forgotPassword(input: ForgotPasswordInput!): Boolean`,
      /* GraphQL */ `
        input ForgotPasswordInput {
          email: String!
        }
      `
    );
  }
  if (mutations.verifyEmail) {
    output = mutation(
      output,
      /* GraphQL */ `verifyEmail(input: VerifyEmailInput!): VerifyEmailResponse!`,
      /* GraphQL */ `
        input VerifyEmailInput {
          username: String
          token: String!
        }

        type VerifyEmailResponse {
          token: String!
        }
      `
    );
  }

  return output;
};
