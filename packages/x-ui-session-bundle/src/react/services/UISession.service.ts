import {
  EventManager,
  Service,
  Event,
  Inject,
  ExecutionContext,
} from "@bluelibs/core";
import { useEffect, useState } from "react";
import { UI_SESSION_BUNDLE_CONFIG_TOKEN } from "../../constants";
import { IXUISessionBundleConfigType, IXUISessionStore } from "../../defs";
import {
  UISessionStateChangeEvent,
  UISessionStateChangeEventProps,
} from "../../events";
import { UISessionStorage } from "./UISessionStorage";
import { UISessionInitialisingEvent } from "../../events/UISesssionInitialisingEvent";

export interface IUISessionOptions {
  persist?: boolean;
}

export type UISessionEventChangeHandler = (
  event: Event<UISessionStateChangeEventProps>
) => Promise<void>;

@Service()
export class UISessionService {
  protected _state: IXUISessionStore;

  constructor(
    protected readonly eventManager: EventManager,
    @Inject(() => UISessionStorage)
    protected readonly storage: UISessionStorage,
    @Inject(UI_SESSION_BUNDLE_CONFIG_TOKEN)
    protected readonly config: IXUISessionBundleConfigType
  ) {}

  async init() {
    const { defaults } = this.config;
    const newDefaults = Object.assign({}, defaults, this.storage.all());

    await this.eventManager.emit(
      new UISessionInitialisingEvent({
        defaults: newDefaults,
      })
    );

    this._state = Object.assign({}, newDefaults);
  }

  /**
   * We don't want to expose the state for modification without using .set()
   */
  get state(): IXUISessionStore {
    return this._state;
  }

  public get<T extends keyof IXUISessionStore>(
    fieldName: T,
    defaultValue?: IXUISessionStore[T]
  ): IXUISessionStore[T] {
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

  public async set<T extends keyof IXUISessionStore>(
    fieldName: T,
    value: IXUISessionStore[T],
    options?: IUISessionOptions
  ) {
    const previousValue = this.state[fieldName];

    this._state = Object.assign(this._state, {
      [fieldName]: value,
    });

    if (options?.persist) {
      this.storage.setItem(fieldName, value);
    }

    return this.eventManager.emit(
      new UISessionStateChangeEvent({
        fieldName,
        value: value,
        previousValue,
        options,
      })
    );
  }

  /**
   * Hook an event when the field changes. Be aware that you will have to de-register this event manually, when no longer needed
   *
   * @param fieldName
   * @param handler
   */
  onSet<T extends keyof IXUISessionStore>(
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
