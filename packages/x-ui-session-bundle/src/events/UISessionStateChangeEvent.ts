import { Event } from "@bluelibs/core";
import { IXUISessionStore } from "..";
import { IUISessionOptions } from "../react/services/UISession.service";

export type UISessionStateChangeEventProps = {
  fieldName: keyof IXUISessionStore;
  previousValue: IXUISessionStore[keyof IXUISessionStore];
  value: IXUISessionStore[keyof IXUISessionStore];
  options?: IUISessionOptions;
};

export class UISessionStateChangeEvent extends Event<UISessionStateChangeEventProps> {}
