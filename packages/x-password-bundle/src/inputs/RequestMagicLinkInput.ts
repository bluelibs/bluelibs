import { Schema, Is, a } from "@bluelibs/validator-bundle";

@Schema()
export class RequestLoginLinkInput {
  @Is(a.string().nullable())
  username?: string;

  @Is(a.string().nullable())
  type?: "email" | "sms" | "phonecall";

  @Is(a.string().nullable())
  sessionToken?: string;

  @Is(a.string().nullable())
  userId: string;
}

@Schema()
export class VerifyMagicLinkInput {
  @Is(a.string().required())
  userId: string;

  @Is(a.string().required())
  magicCode: string;

  @Is(a.string().nullable())
  sessionToken?: string;
}
