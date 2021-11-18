import { Event } from "@bluelibs/core";

export class UISessionInitialisingEvent extends Event<{
  defaults: {
    [key: string]: any;
  };
}> {}
