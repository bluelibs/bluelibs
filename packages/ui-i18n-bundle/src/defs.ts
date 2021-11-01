import Polyglot from "node-polyglot";

export interface IUII18NBundleConfig {
  defaultLocale: string;
  //     /**
  //      * This is used for when you want customly configured polyglots allowing you to customise the options
  //      */
  polyglots: Array<Polyglot.PolyglotOptions & { locale: string }>;
}
