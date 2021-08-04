// import "./XUIProvider.test";
import "./useUISession.test";
import "../index";

declare module "../" {
  export interface IUISessionStore {
    lastAuthenticationDate: Date;
  }
}
