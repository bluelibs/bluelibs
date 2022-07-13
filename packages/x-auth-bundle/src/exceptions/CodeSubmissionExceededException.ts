import { Exception } from "@bluelibs/core";

export class CodeSubmissionExceededException extends Exception {
  getMessage() {
    return "You exceeded max attempts to validate code";
  }
}
