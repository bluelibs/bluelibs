import { Bundle } from "@bluelibs/core";
import { I18N_CONFIG_TOKEN } from ".";
import { IUII18NBundleConfig } from "./defs";

export class XUII18NBundle extends Bundle<IUII18NBundleConfig> {
  protected defaultConfig = {
    defaultLocale: "en",
    polyglots: [],
  } as IUII18NBundleConfig;

  async prepare() {
    this.container.set(I18N_CONFIG_TOKEN, this.config);
  }
}
