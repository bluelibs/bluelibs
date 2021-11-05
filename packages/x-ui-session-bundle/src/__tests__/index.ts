import "../";

import "./useUISession.test";

declare module "../" {
  export interface IUISessionStore {
    locale: string;
  }
}
