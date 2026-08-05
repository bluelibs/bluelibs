import {
  ContainerInstance,
  EventManager,
  IEventConstructor,
  EventHandlerType,
  IEventHandlerOptions,
} from "..";
import { Inject, ServiceIdentifier } from "../di";
import { HandlerOptionsDefaults } from "./EventManager";

// @Service() - Abstract classes should not be decorated as services
// Subclasses will use @Service()
export abstract class Listener {
  @Inject(() => EventManager)
  protected eventManager!: EventManager;

  @Inject(() => ContainerInstance)
  protected container!: ContainerInstance;

  public init() {
    for (const member of getAllFuncs(this)) {
      const method = this[member as keyof this] as unknown as EventHandlerType;
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
  protected on<T>(
    eventClass: IEventConstructor<T>,
    handler: EventHandlerType<T>,
    options: IEventHandlerOptions<T> = HandlerOptionsDefaults
  ) {
    this.eventManager.addListener(eventClass, handler, options);
  }

  /**
   * Returns the service by its id
   * @param serviceId
   */
  public get<T = unknown>(serviceId: ServiceIdentifier<T>): T {
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
  let obj: object | null = toCheck as object | null;
  do {
    props = props.concat(Object.getOwnPropertyNames(obj));
  } while ((obj = Object.getPrototypeOf(obj)));

  return props.sort().filter(function (e, i, arr) {
    if (
      e != arr[i + 1] &&
      typeof (toCheck as Record<string, unknown>)[e] == "function"
    )
      return true;
    return false;
  });
}
