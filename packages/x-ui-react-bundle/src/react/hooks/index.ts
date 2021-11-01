import {
  EventHandlerType,
  EventManager,
  IEventConstructor,
} from "@bluelibs/core";
import { useContext, useEffect } from "react";

import { ContainerContext } from "../XUIProvider";
import { use } from "./use";
import { useUIComponents } from "./useUIComponents";

// START OF EXPORTS

export { use, useUIComponents };

export const useContainer = () => {
  return useContext(ContainerContext);
};

export const useEventManager = () => {
  return use(EventManager);
};

export const listen = <T = any>(
  eventClass: IEventConstructor<T>,
  listener: EventHandlerType<T>
) => {
  const manager = useEventManager();
  useEffect(() => {
    manager.addListener(eventClass, listener);

    return () => {
      manager.removeListener(eventClass, listener);
    };
  }, []);
};

export const useListener = listen;
