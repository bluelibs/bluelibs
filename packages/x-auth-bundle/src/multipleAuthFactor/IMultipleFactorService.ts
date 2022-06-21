import {
  UserId,
  ICreateSessionOptions,
  ISession,
} from "@bluelibs/security-bundle";

import { MultipleFactorRedirect } from "./defs";

export interface IMultipleFactorService {
  isMultipleFactorRequired(): boolean;
  login(
    userId: UserId,
    options: ICreateSessionOptions
  ): Promise<{ token: string } | MultipleFactorRedirect>;
  userHaveToMultipleFactorAuth: (userId: UserId) => Promise<boolean>;
  loginSessionFactor(
    userId: UserId,
    factorStratergy: string
  ): Promise<ISession>;
}
