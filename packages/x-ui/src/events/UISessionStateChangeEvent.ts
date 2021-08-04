import { Event } from "@bluelibs/core";
import { IUISessionStore } from "../react/services/UISession.service";

export type UISessionStateChangeEventProps = {
  fieldName: keyof IUISessionStore;
  previousValue: IUISessionStore[keyof IUISessionStore];
  value: IUISessionStore[keyof IUISessionStore];
};

export class UISessionStateChangeEvent extends Event<
  UISessionStateChangeEventProps
> {}
