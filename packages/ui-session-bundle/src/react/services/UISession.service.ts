import { EventManager, Service, Event } from "@bluelibs/core";
import { useEffect, useState } from "react";
import { IUISessionBundleConfigType, IUISessionStore } from "../../defs";
import {
  UISessionStateChangeEvent,
  UISessionStateChangeEventProps,
} from "../../events";
import {
  getLocalStorageState,
  updateLocalStorageState,
} from "./utils/UISession.utils";

export interface IUISessionOptions {
  persist?: boolean;
}

export type UISessionEventChangeHandler = (
  event: Event<UISessionStateChangeEventProps>
) => Promise<void>;

@Service()
export class UISessionService {
  protected _state: IUISessionStore;
  protected localStorageKey: string;

  constructor(
    protected readonly eventManager: EventManager,
    config: IUISessionBundleConfigType
  ) {
    const { localStorageKey, defaults } = config;

    const localStorageState = getLocalStorageState(localStorageKey);

    this._state = Object.assign({}, defaults, localStorageState);
    this.localStorageKey = localStorageKey;
  }

  /**
   * We don't want to expose the state for modification without using .set()
   */
  get state(): IUISessionStore {
    return this._state;
  }

  public get<T extends keyof IUISessionStore>(
    fieldName: T,
    defaultValue?: IUISessionStore[T]
  ): IUISessionStore[T] {
    const fieldValue =
      defaultValue !== undefined && this._state[fieldName] === undefined
        ? defaultValue
        : this._state[fieldName];

    const [value, setValue] = useState(fieldValue);

    useEffect(() => {
      const handler = async (e: Event<UISessionStateChangeEventProps>) => {
        setValue(e.data.value);
      };

      this.onSet(fieldName, handler);

      return () => {
        this.eventManager.removeListener(UISessionStateChangeEvent, handler);
      };
    }, []);

    return value;
  }

  public async set<T extends keyof IUISessionStore>(
    fieldName: T,
    value: IUISessionStore[T],
    options?: IUISessionOptions
  ) {
    const previousValue = this.state[fieldName];

    this._state = Object.assign({
      [fieldName]: value,
    });

    if (options?.persist) {
      updateLocalStorageState(fieldName, value, this.localStorageKey);
    }

    return this.eventManager.emit(
      new UISessionStateChangeEvent({
        fieldName,
        value: value,
        previousValue,
      })
    );
  }

  /**
   * Hook an event when the field changes. Be aware that you will have to de-register this event manually, when no longer needed
   *
   * @param fieldName
   * @param handler
   */
  onSet<T extends keyof IUISessionStore>(
    fieldName: T,
    handler: UISessionEventChangeHandler
  ) {
    this.eventManager.addListener(UISessionStateChangeEvent, handler, {
      filter: (e) => e.data.fieldName === fieldName,
    });
  }

  onSetRemove(handler: UISessionEventChangeHandler) {
    this.eventManager.removeListener(UISessionStateChangeEvent, handler);
  }
}
