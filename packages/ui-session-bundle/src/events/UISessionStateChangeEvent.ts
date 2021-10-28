import { Event } from "@bluelibs/core";
import { IUISessionStore } from "..";

export type UISessionStateChangeEventProps = {
  fieldName: keyof IUISessionStore;
  previousValue: IUISessionStore[keyof IUISessionStore];
  value: IUISessionStore[keyof IUISessionStore];
};

export class UISessionStateChangeEvent extends Event<UISessionStateChangeEventProps> {}
