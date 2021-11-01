import { GuardianSmart } from "../..";

export const appGuardianTest = {
  works: false,
};

export class AppGuardian extends GuardianSmart {
  constructor() {
    super();

    appGuardianTest.works = true;
  }
}
