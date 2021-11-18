export interface IUISessionStore {}

export type IUISessionBundleConfigType = {
  /**
   * @deprecated
   */
  localStorageKey?: string;
  defaults?: IUISessionStore;
};
