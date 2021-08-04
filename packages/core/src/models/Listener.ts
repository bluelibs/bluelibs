import {
  ContainerInstance,
  EventManager,
  IEventConstructor,
  EventHandlerType,
  IEventHandlerOptions,
} from "..";
import { Inject, Service } from "../di";
import { HandlerOptionsDefaults } from "./EventManager";

@Service()
export abstract class Listener {
  @Inject(() => EventManager)
  protected eventManager: EventManager;

  @Inject(() => ContainerInstance)
  protected container: ContainerInstance;

  public init() {
    for (const member of getAllFuncs(this)) {
      const method = (this[member] as any) as EventHandlerType;
      // Not inherited
      const metadata = Reflect.getMetadata(eventHandlerMetadata, this, member);
      if (metadata) {
        const { eventClass, eventOptions } = metadata;
        this.eventManager.addListener(
          eventClass,
          event => method.call(this, event),
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

export function On(
  eventClass: IEventConstructor,
  eventOptions?: IEventHandlerOptions
) {
  return Reflect.metadata(eventHandlerMetadata, { eventClass, eventOptions });
}

function getAllFuncs(toCheck) {
  var props: string[] = [];
  var obj = toCheck;
  do {
    props = props.concat(Object.getOwnPropertyNames(obj));
  } while ((obj = Object.getPrototypeOf(obj)));

  return props.sort().filter(function(e, i, arr) {
    if (e != arr[i + 1] && typeof toCheck[e] == "function") return true;
  });
}
