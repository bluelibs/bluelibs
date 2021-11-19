export interface IXUISessionStore {}

export type IXUISessionBundleConfigType = {
  /**
   * @deprecated
   */
  localStorageKey?: string;
  defaults?: IXUISessionStore;
};
