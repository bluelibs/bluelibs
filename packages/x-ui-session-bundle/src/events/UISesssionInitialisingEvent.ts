import { Event } from "@bluelibs/core";
import { IXUISessionStore } from "../defs";

export class UISessionInitialisingEvent extends Event<{
  defaults: IXUISessionStore;
}> {}
