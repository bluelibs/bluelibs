import { EventManager, Inject, Service } from "@bluelibs/core";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Polyglot = require("node-polyglot");
import { IXUII18NBundleConfig } from "../../defs";
import { I18N_CONFIG_TOKEN } from "../../constants";
import { LocaleChangedEvent } from "../events";

export type I18NConfig = Record<string, I18NMessages>;

export type I18NMessages = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: string | I18NMessages | any;
};

@Service()
export class I18NService {
  // locale, polyglot
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public polyglots = new Map<string, any>();

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

  protected activePolyglot: typeof Polyglot | null = null;

  /**
   * Add or update messages for the specific locale
   *
   * @param locale
   * @param messages
   * @param prefix
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extend(locale: string, messages: any, prefix?: string): void {
    this.getPolyglot(locale).extend(messages, prefix);
  }

  /**
   * Used to set multiple languages in the form of { "language": { messages } }
   * Runs extend() automatically behind the scenes
   *
   * @param configs
   * @returns
   */
  store(configs: I18NConfig | I18NConfig[]): void {
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
  setLocale(locale: string): void {
    this.activePolyglot = this.getPolyglot(locale);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.eventManager.emit as any)(new LocaleChangedEvent({ locale }));
  }

  /**
   * Translates the string based on the current active locale
   * @param string
   * @param options
   * @returns
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t = (string: string, options?: any) => {
    return this.activePolyglot.t(string, options);
  };

  /**
   * Gives you the polyglot instance based on locale. Creates a new one if it doesn't find it
   * @param locale
   * @returns
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getPolyglot(locale: string): any {
    let polyglot = this.polyglots.get(locale);

    if (!polyglot) {
      polyglot = new Polyglot({ locale });
      this.polyglots.set(locale, polyglot);
    }

    return polyglot;
  }

  getCurrentPolyglot(): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.activePolyglot as any)["currentLocale"] || this.config?.defaultLocale;
  }
}
