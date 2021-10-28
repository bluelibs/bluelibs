export interface IUISessionStore {}

export type IUISessionBundleConfigType = {
  localStorageKey?: string;

  defaults?: IUISessionStore;
};
