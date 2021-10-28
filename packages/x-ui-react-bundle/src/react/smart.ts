import { Service } from "@bluelibs/core";
import { Smart as BaseSmart, smart, newSmart, useSmart } from "@bluelibs/smart";

@Service({
  transient: true,
})
export class Smart<S, C> extends BaseSmart<S, C> {}

export { smart, newSmart, useSmart };
