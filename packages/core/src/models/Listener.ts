import {
  ContainerInstance,
  EventManager,
  IEventConstructor,
  EventHandlerType,
  IEventHandlerOptions,
} from "..";
import { Inject } from "../di";
import { HandlerOptionsDefaults } from "./EventManager";

// @Service() - Abstract classes should not be decorated as services
// Subclasses will use @Service()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class Listener implements Record<string, any> {
  @Inject(() => EventManager)
  protected eventManager!: EventManager;

  @Inject(() => ContainerInstance)
  protected container!: ContainerInstance;

  public init() {
    for (const member of getAllFuncs(this)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const method = this[member as keyof this] as any as EventHandlerType;
      // Not inherited
      const metadata = Reflect.getMetadata(eventHandlerMetadata, this, member);
      if (metadata) {
        const { eventClass, eventOptions } = metadata;
        this.eventManager.addListener(
          eventClass,
          (event) => method.call(this, event),
          eventOptions
        );
      }
    }
  }

  /**
   * Listen to events
   * @param eventClass This is the event class, make sure you don't use an instance here
   * @param handler This is the function that handles the event emission
   * @param options Options
   */
  protected on(
    eventClass: IEventConstructor,
    handler: EventHandlerType,
    options: IEventHandlerOptions = HandlerOptionsDefaults
  ) {
    this.eventManager.addListener(eventClass, handler, options);
  }

  /**
   * Returns the service by its id
   * @param serviceId
   */
  public get<T = any>(serviceId: any): T {
    return this.container.get<T>(serviceId);
  }
}

const eventHandlerMetadata = Symbol("eventHandler");

export function On<T>(
  eventClass: IEventConstructor<T>,
  eventOptions?: IEventHandlerOptions<T>
) {
  return Reflect.metadata(eventHandlerMetadata, { eventClass, eventOptions });
}

function getAllFuncs(toCheck: unknown): string[] {
  let props: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let obj: any = toCheck;
  do {
    props = props.concat(Object.getOwnPropertyNames(obj));
  } while ((obj = Object.getPrototypeOf(obj)));

  return props.sort().filter(function (e, i, arr) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (e != arr[i + 1] && typeof (toCheck as any)[e] == "function")
      return true;
    return false;
  });
}
