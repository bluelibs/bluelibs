import * as React from "react";
import { act, renderHook, RenderResult } from "@testing-library/react-hooks";
import { UISessionEventChangeHandler, IUISessionStore } from "../";
import { useUISession } from "../react/hooks";
import { getLocalStorageState } from "../react/services/utils/UISession.utils";
import { container, sessionsConfig } from "./ecosystem";
import { UISessionService } from "../react";
import { ContainerContext } from "@bluelibs/x-ui-react-bundle";

const containerContextProvider = ({ children }) => {
  return (
    <ContainerContext.Provider value={container}>
      {children}
    </ContainerContext.Provider>
  );
};

const getSessionHook = () => {
  const { result } = renderHook(useUISession, {
    wrapper: containerContextProvider,
  });

  return result;
};

const getFieldHook = <T extends keyof IUISessionStore>(
  sessionHook: RenderResult<UISessionService>,
  fieldName: T
) => {
  const { result } = renderHook(() => sessionHook.current.get(fieldName));

  return result;
};

describe("useUISession", () => {
  test("sessionDefaults", () => {
    const sessionHook = getSessionHook();

    const { defaults } = sessionsConfig;

    expect(sessionHook.current.state).toStrictEqual(defaults);
  });

  test("set and get", async () => {
    const sessionHook = getSessionHook();

    const locale = "en";

    await act(async () => sessionHook.current.set("locale", locale));

    const fieldHook = getFieldHook(sessionHook, "locale");

    expect(fieldHook.current).toStrictEqual(locale);
  });

  test("onSet and onSetRemove", async () => {
    const sessionHook = getSessionHook();

    const locale = "en";

    let handlerIsCalled = false;

    const handler: UISessionEventChangeHandler = async () => {
      handlerIsCalled = !handlerIsCalled;
    };

    act(() => sessionHook.current.onSet("locale", handler));

    await act(async () => sessionHook.current.set("locale", locale));

    expect(handlerIsCalled).toStrictEqual(true);

    act(() => sessionHook.current.onSetRemove(handler));

    await act(async () => sessionHook.current.set("locale", locale));

    expect(handlerIsCalled).toStrictEqual(true);
  });

  test("persistance - simple set", async () => {
    const sessionHook = getSessionHook();

    const locale = "en";

    await act(async () =>
      sessionHook.current.set("locale", locale, { persist: true })
    );

    const localStorageState = getLocalStorageState(
      sessionsConfig.localStorageKey
    );

    expect(localStorageState.locale).toEqual(locale);
  });

  test("persistance - set with handler", async () => {
    const sessionHook = getSessionHook();

    let handlerIsCalled = false;

    const handler: UISessionEventChangeHandler = async () => {
      handlerIsCalled = !handlerIsCalled;
    };

    const locale = "en";

    act(() => sessionHook.current.onSet("locale", handler));

    await act(async () =>
      sessionHook.current.set("locale", locale, {
        persist: true,
      })
    );

    const localStorageState = getLocalStorageState(
      sessionsConfig.localStorageKey
    );

    expect(handlerIsCalled).toStrictEqual(true);
    expect(localStorageState.locale).toStrictEqual(locale);
  });

  test("uses existing values from localStorage, and defaults for rest", () => {
    const sessionHook = getSessionHook();

    const localStorageState = getLocalStorageState(
      sessionsConfig.localStorageKey
    );

    const localStorageStateKeys = Object.keys(localStorageState);

    const { localStorageKey, defaults } = sessionsConfig;

    for (const key of Object.keys(defaults)) {
      const value = sessionHook.current.state[key];
      if (localStorageStateKeys.includes(key)) {
        expect(value).toStrictEqual(localStorageState[key]);
      } else {
        expect(value).toStrictEqual(sessionsConfig[key]);
      }
    }
  });

  test("value and previousValue", async () => {
    const sessionHook = getSessionHook();

    const previousLocale = "en";
    const newLocale = "de";

    await act(async () => sessionHook.current.set("locale", previousLocale));

    const handler: UISessionEventChangeHandler = async (e) => {
      expect(e.data.previousValue).toBe(previousLocale);
      expect(e.data.value).toBe(newLocale);
    };

    act(() => sessionHook.current.onSet("locale", handler));

    await act(async () => sessionHook.current.set("locale", newLocale));
  });
});
