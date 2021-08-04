import { Constructor, Token } from "@bluelibs/core";
import { useMemo } from "react";
import { useContainer } from "./index";

export type UseOptionsType = {
  /**
   * When transient is enabled we will not memo the container's result. This is the option to be used when dealing with Transient services for which you want a new instance every time you render.
   * Also note that you can still have transient services that do not have this option enabled, basically it would create the new instance just once.
   */
  transient?: boolean;
};

export const use = <T = any>(
  id: Constructor<T> | Token<T> | string,
  options?: UseOptionsType
): T => {
  const container = useContainer();
  if (options?.transient) {
    return container.get(id);
  }

  return useMemo(() => {
    return container.get(id);
  }, []);
};
