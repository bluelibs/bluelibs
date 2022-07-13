import { Schema, Is, a } from "@bluelibs/validator-bundle";

@Schema()
export class ForgotPasswordInput {
  @Is(a.string().required())
  email: string;
}
