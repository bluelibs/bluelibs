import { use } from "@bluelibs/x-ui-react-bundle";
import { I18NService } from "..";

export const useTranslate = (prefix?: string) => {
  const t = use(I18NService).t;
  if (!prefix) {
    return t;
  } else {
    return (s) => t(prefix + "." + s);
  }
};
