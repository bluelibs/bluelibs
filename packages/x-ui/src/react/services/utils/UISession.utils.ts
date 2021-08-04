import { EJSON } from "@bluelibs/ejson";
import { IUISessionStore } from "../UISession.service";

export const updateLocalStorageState = <T extends keyof IUISessionStore>(
  key: T,
  value: IUISessionStore[T],
  localStorageKey: string
): void => {
  const newState = Object.assign(getLocalStorageState(localStorageKey) || {}, {
    [key]: value,
  });

  const stringifiedState = EJSON.stringify(newState);

  localStorage.setItem(localStorageKey, stringifiedState);
};

export const getLocalStorageState = (
  localStorageKey: string
): Partial<IUISessionStore> => {
  return EJSON.parse(localStorage.getItem(localStorageKey) || "{}");
};
