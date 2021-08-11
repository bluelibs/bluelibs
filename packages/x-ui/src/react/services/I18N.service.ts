import * as Polyglot from "node-polyglot";
import { EventManager, Inject, Service } from "@bluelibs/core";
import { XUI_CONFIG_TOKEN } from "../../constants";
import { XUIBundleConfigType } from "../../defs";
import { LocaleChangedEvent } from "../events/LocaleChangedEvent";

@Service()
export class I18NService {
  // locale, polyglot
  public polyglots = new Map<string, Polyglot>();

  constructor(
    @Inject(XUI_CONFIG_TOKEN)
    protected readonly xuiConfig: XUIBundleConfigType,
    protected readonly eventManager: EventManager
  ) {
    const { polyglots, defaultLocale } = xuiConfig.i18n;
    if (polyglots) {
      polyglots.forEach((polyglotConfig) => {
        this.polyglots.set(polyglotConfig.locale, new Polyglot(polyglotConfig));
      });
    }
    this.setLocale(defaultLocale);
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
   * Sets the current locale
   * @param locale
   */
  setLocale(locale) {
    this.activePolyglot = this.getPolyglot(locale);
    this.eventManager.emit(new LocaleChangedEvent({ locale }));
  }

  /**
   * Translates the string based on the current active locale
   * @param string
   * @param options
   * @returns
   */
  t = (string, options?: Polyglot.InterpolationOptions) => {
    return this.activePolyglot.t(string, options);
  };

  /**
   * Gives you the polyglot instance based on locale. Creates a new one if it doesn't find it
   * @param locale
   * @returns
   */
  getPolyglot(locale): Polyglot {
    let polyglot = this.polyglots.get(locale);

    if (!polyglot) {
      polyglot = new Polyglot({ locale });
      this.polyglots.set(locale, polyglot);
    }

    return polyglot;
  }
}
