import Polyglot from "node-polyglot";

export interface IXUII18NBundleConfig {
  defaultLocale: string;
  //     /**
  //      * This is used for when you want customly configured polyglots allowing you to customise the options
  //      */
  polyglots: Array<
    Polyglot.PolyglotOptions & {
      locale: string;
      domain?: string;
      http?: boolean;
    }
  >;
}

/**
 * @deprecated Use IXUII18NBundleConfig
 */
export interface IUII18NBundleConfig extends IXUII18NBundleConfig {}
