import "./XUIBundle.test";
import "../index";

declare module "../" {
  export interface IUISessionStore {
    lastAuthenticationDate: Date;
  }
}
