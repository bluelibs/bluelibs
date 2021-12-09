import { Event } from "@bluelibs/core";
import { GuardianUserType } from "../smarts/GuardianSmart";

export class GuardianUserRetrievedEvent<
  TUserType = GuardianUserType
> extends Event<{
  user: Partial<TUserType>;
}> {}
