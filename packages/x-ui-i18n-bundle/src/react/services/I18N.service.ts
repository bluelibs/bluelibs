import { EventManager, Inject, Service } from "@bluelibs/core";

import * as Polyglot from "node-polyglot";
import { IXUII18NBundleConfig } from "../../defs";
import { I18N_CONFIG_TOKEN } from "../../constants";

export type I18NConfig = Record<string, I18NMessages>;

export type I18NMessages = {
  [key: string]: string | I18NMessages;
};

@Service()
export class I18NService {
  // locale, polyglot
  public polyglots = new Map<string, Polyglot>();

  constructor(
    @Inject(I18N_CONFIG_TOKEN)
    protected readonly config: IXUII18NBundleConfig,
    protected readonly eventManager: EventManager
  ) {
    if (config.polyglots) {
      config.polyglots.forEach((polyglotConfig) => {
        this.polyglots.set(polyglotConfig.locale, new Polyglot(polyglotConfig));
      });
    }

    this.setLocale(config.defaultLocale);
  }

  protected activePolyglot: Polyglot = null;

  /**
   * Add or update messages for the specific locale
   *
   * @param locale
   * @param messages
   * @param prefix
   */
  extend(locale: string, messages: any, prefix?: string) {
    this.getPolyglot(locale).extend(messages, prefix);
  }

  /**
   * Used to set multiple languages in the form of { "language": { messages } }
   * Runs extend() automatically behind the scenes
   *
   * @param configs
   * @returns
   */
  store(configs: I18NConfig | I18NConfig[]) {
    if (!Array.isArray(configs)) {
      return this.store([configs]);
    }

    configs.forEach((config) => {
      for (const locale in config) {
        this.extend(locale, config[locale]);
      }
    });
  }

  /**
   * Sets the current locale
   * @param locale
   */
  setLocale(locale: string) {
    this.activePolyglot = this.getPolyglot(locale);
    // this.eventManager.emit(new LocaleChangedEvent({ locale }));
  }

  /**
   * Translates the string based on the current active locale
   * @param string
   * @param options
   * @returns
   */
  t = (string: string, options?: Polyglot.InterpolationOptions) => {
    return this.activePolyglot.t(string, options);
  };

  /**
   * Gives you the polyglot instance based on locale. Creates a new one if it doesn't find it
   * @param locale
   * @returns
   */
  getPolyglot(locale: string): Polyglot {
    let polyglot = this.polyglots.get(locale);

    if (!polyglot) {
      polyglot = new Polyglot({ locale });
      this.polyglots.set(locale, polyglot);
    }

    return polyglot;
  }
}
