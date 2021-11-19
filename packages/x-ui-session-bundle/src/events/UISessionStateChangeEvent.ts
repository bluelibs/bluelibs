import { Event } from "@bluelibs/core";
import { IXUISessionStore } from "..";

export type UISessionStateChangeEventProps = {
  fieldName: keyof IXUISessionStore;
  previousValue: IXUISessionStore[keyof IXUISessionStore];
  value: IXUISessionStore[keyof IXUISessionStore];
};

export class UISessionStateChangeEvent extends Event<UISessionStateChangeEventProps> {}
