import {
  ContainerInstance,
  EventHandlerType,
  EventManager,
  IEventConstructor,
} from "@bluelibs/core";
import { useContext, useEffect } from "react";

import { ContainerContext } from "../XUIProvider";
import { XRouter } from "../XRouter";
import { use } from "./use";
import {
  useSubscription,
  useCollectionSubscription,
  useCollectionSubscriptionOne,
} from "./useSubscription";
import { GuardianSmart } from "../smarts/GuardianSmart";
import { useSmart } from "../smart";
import { UISession } from "../services/UISession.service";
import { I18NService } from "../services/I18N.service";

// START OF EXPORTS
export { useUIComponents } from "./useUIComponents";
export {
  use,
  useSubscription,
  useCollectionSubscription,
  useCollectionSubscriptionOne,
};
export { useData, useDataOne } from "./useData";
export { useLiveData, useLiveDataOne } from "./useLiveData";

export const useContainer = (): ContainerInstance => {
  return useContext(ContainerContext);
};

export const useRouter = (): XRouter => {
  return use<XRouter>(XRouter);
};

export const useEventManager = (): EventManager => {
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

export const useGuardian = (): GuardianSmart => {
  return useSmart(GuardianSmart);
};

export const useUISession = (): UISession => {
  return use(UISession);
};

export const useTranslate = () => use(I18NService).t;
