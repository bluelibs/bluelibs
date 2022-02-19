import {
  UserId,
  ICreateSessionOptions,
  ISession,
} from "@bluelibs/security-bundle";

import { MultipleFcatorRedirect } from "./defs";

export interface IMultipleFactorService {
  isMultipleFactorRequired(): boolean;
  login(
    userId: UserId,
    options: ICreateSessionOptions
  ): Promise<{ token: string } | MultipleFcatorRedirect>;
  userHaveToMultipleFactorAuth: (userId: UserId) => Promise<boolean>;
  loginSessionFactor(
    userId: UserId,
    sessionToken: string,
    factorStratergy: string
  ): Promise<ISession>;
}
