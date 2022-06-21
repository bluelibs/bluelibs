import { Collection, Behaviors } from "@bluelibs/mongo-bundle";
import { AuthenticationCodes } from "./AuthenticationCodes.model";

export class AuthenticationCodesCollection extends Collection<AuthenticationCodes> {
  static collectionName = "AuthenticationCodes";
  static model = AuthenticationCodes;
}
