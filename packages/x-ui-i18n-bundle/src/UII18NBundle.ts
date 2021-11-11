import { Bundle } from "@bluelibs/core";
import { I18N_CONFIG_TOKEN } from ".";
import { IUII18NBundleConfig } from "./defs";

export class UII18NBundle extends Bundle<IUII18NBundleConfig> {
  protected defaultConfig = {
    defaultLocale: "en",
    polyglots: [],
  } as IUII18NBundleConfig;

  // TODO: is the token reaally needed?
  async prepare() {
    this.container.set(I18N_CONFIG_TOKEN, this.config);
  }
}
