import "../";
import "./useUISession.test";

declare module "../" {
  export interface IXUISessionStore {
    locale: string;
  }
}
