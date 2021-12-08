import { use } from "@bluelibs/x-ui-react-bundle";
import { I18NService } from "..";

import Polyglot from "node-polyglot";

export const useTranslate = (prefix?: string) => {
  const t = use(I18NService).t;
  if (!prefix) {
    return t;
  } else {
    return (s: string, options?: Polyglot.InterpolationOptions) =>
      t(prefix + "." + s, options);
  }
};
