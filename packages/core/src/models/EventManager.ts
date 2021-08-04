import { Service } from "typedi";
import {
  IListenerStorage,
  IEventConstructor,
  EventHandlerType,
  IEventHandlerOptions,
  Constructor,
} from "../defs";

export const HandlerOptionsDefaults = { order: 0 };

export class Event<T = null> {
  public data: T;

  constructor(...args: T extends null ? [] : [T]) {
    if (args[0] !== undefined) {
      this.data = args[0];
    }
  }

  async validate() {}

  get name() {
    return this.constructor.name;
  }
}

@Service()
export class EventManager {
  protected listeners = new Map<Constructor<Event<any>>, IListenerStorage[]>();
  protected globalListeners: IListenerStorage[] = [];

  /**
   * Emit to all listeners of this event
   * @param data
   */
  public async emit(event: Event<any>): Promise<void> {
    await event.validate();

    let listeners = this.getListeners(
      event.constructor as IEventConstructor
    ).slice(0);

    // This is not a very smart idea, to always sort by the global listeners
    // But we need a way to blend the global listeners smartly so they are sorted when they're added
    // And they need to work when there is no listener too.
    // However, sorting should be quick since both arrays are already sorted.
    if (this.globalListeners.length) {
      listeners.push(...this.globalListeners);
      this.sortListeners(listeners);
    }

    let ok;
    for (const listener of listeners) {
      ok = true;
      if (listener.filter) {
        ok = listener.filter(event);
      }

      if (ok) {
        await listener.handler(event);
      }
    }
  }

  /**
   * Adds the handler to this event
   */
  public addListener<T>(
    eventClass: IEventConstructor<T>,
    handler: EventHandlerType<T>,
    options: IEventHandlerOptions<T> = HandlerOptionsDefaults
  ): EventManager {
    const listeners = this.getListeners(eventClass);

    listeners.push({
      handler,
      order: options.order || 0,
      filter: options.filter,
    });

    this.sortListeners(listeners);

    return this;
  }

  /**
   * Listen to all events
   *
   * @param handler
   * @param options
   */
  public addGlobalListener(
    handler: EventHandlerType,
    options: IEventHandlerOptions = HandlerOptionsDefaults
  ) {
    this.globalListeners.push({
      order: options.order || 0,
      filter: options.filter,
      handler,
    });

    this.sortListeners(this.globalListeners);

    return this;
  }

  protected getListeners<T>(
    eventClass: IEventConstructor<T>
  ): IListenerStorage[] {
    if (!this.listeners.has(eventClass)) {
      this.listeners.set(eventClass, []);
    }

    return this.listeners.get(eventClass) || [];
  }

  /**
   * @param array
   */
  protected sortListeners(array: IListenerStorage[]) {
    array.sort((a, b) => {
      return a.order - b.order;
    });
  }

  /**
   * @param handler
   */
  public removeGlobalListener(handler: EventHandlerType) {
    this.globalListeners = this.globalListeners.filter(listener => {
      listener.handler !== handler;
    });

    return this;
  }

  /**
   * Removes the handler from this event.
   */
  public removeListener(
    eventClass: IEventConstructor,
    handler: EventHandlerType
  ): EventManager {
    let listeners = this.listeners.get(eventClass);

    if (!listeners) {
      return this;
    }

    listeners = listeners.filter(listener => listener.handler !== handler);

    this.listeners.set(eventClass, listeners);

    return this;
  }
}
