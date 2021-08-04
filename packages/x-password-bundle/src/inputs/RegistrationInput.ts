import { Schema, Is, a } from "@bluelibs/validator-bundle";

@Schema()
export class RegistrationInput {
  @Is(a.string().required())
  firstName?: string;

  @Is(a.string().required())
  lastName?: string;

  @Is(a.string().required())
  email: string;

  @Is(a.string().required())
  password: string;
}
