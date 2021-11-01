import { Event } from "@bluelibs/core";

export class LocaleChangedEvent extends Event<{ locale: string }> {}
