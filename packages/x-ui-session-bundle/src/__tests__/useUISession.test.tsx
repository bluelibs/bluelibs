import * as React from "react";
import { act, renderHook, RenderResult } from "@testing-library/react-hooks";
import { UISessionEventChangeHandler, IXUISessionStore } from "../";
import { useUISession } from "../react/hooks";
import { sessionsConfig } from "./ecosystem";
import { UISessionService } from "../react";
import { ContainerContext, useContainer } from "@bluelibs/x-ui-react-bundle";
import { UISessionStorage } from "../react/services/UISesssionStorage";
import { ContainerInstance } from "@bluelibs/core";
import { container } from "./ecosystem";
import { EJSON } from "@bluelibs/ejson";

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

const getContainerHook = (): ContainerInstance => {
  const { result } = renderHook(useContainer, {});

  return result.current;
};

const getFieldHook = <T extends keyof IXUISessionStore>(
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

    const storage = container.get(UISessionStorage);
    expect(storage.getItem("locale")).toEqual(locale);
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

    const storage = container.get(UISessionStorage);

    expect(handlerIsCalled).toStrictEqual(true);
    expect(storage.getItem("locale")).toStrictEqual(locale);
  });

  test("uses existing values from localStorage, and defaults for rest", () => {
    const sessionHook = getSessionHook();

    const storage = container.get(UISessionStorage);
    const localStorageState = storage.all();
    const localStorageStateKeys = Object.keys(localStorageState);

    const { defaults } = sessionsConfig;

    for (const key of Object.keys(defaults)) {
      const value = sessionHook.current.state[key];

      expect(value).toStrictEqual(sessionHook.current.state[key]);
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
