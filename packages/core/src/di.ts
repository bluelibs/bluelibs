import {
  ContainerInstance as BaseContainerInstance,
  ServiceIdentifier,
  ServiceNotFoundError,
  Container,
  ServiceOptions,
  Constructable,
  ServiceMetadata,
  Token,
} from "typedi";

export { Inject, Token } from "typedi";

const SERVICE_META_STORAGE = Symbol("ServiceInfo");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor = new (...args: any[]) => unknown;

export function Service<T = unknown>(
  options?: ServiceOptions<T>
): (target: Constructor) => void {
  return (targetConstructor): void => {
    const opts = options || {};

    const serviceMetadata: ServiceMetadata<T> = {
      id: opts.id || targetConstructor,
      type: targetConstructor as unknown as Constructable<T>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      factory: (opts as any).factory || undefined,
      multiple: opts.multiple || false,
      eager: opts.eager || false,
      // @ts-expect-error typedi internal property
      scope:
        // @ts-expect-error typedi internal property
        opts.scope || (opts.transient ? "transient" : null) || "container",
      transient: opts.transient || false,

      // @ts-expect-error typedi internal property
      referencedBy: new Map().set(Container.id, Container),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (targetConstructor as any)[SERVICE_META_STORAGE] = serviceMetadata;
  };
}

export class ContainerInstance extends BaseContainerInstance {
  get<T>(id: ServiceIdentifier<T>): T {
    // @ts-expect-error accessing internal method
    if (!this.has(id)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((id as any)[SERVICE_META_STORAGE]) {
        // It's clearly a constructor
        this.set({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(id as any)[SERVICE_META_STORAGE],
          id,
          type: id as unknown as Constructable<T>,
        });

        return super.get(id);
      }
    }

    try {
      return super.get(id);
    } catch (e: unknown) {
      // The reason we do this is to allow services that don't specify @Service()
      if (
        e instanceof ServiceNotFoundError ||
        (e as Error).toString() === "ServiceNotFoundError"
      ) {
        if (typeof id === "function") {
          // console.warn(
          //   `You have tried to get from the container a class (${id?.name}) which doesn't have @Service() specified. Please add it to remove this warning.`
          // );
          this.set({
            id: id as unknown as Constructable<T>,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            type: id as any,
          });
          return super.get(id);
        }
      }
      console.error(
        `ServiceNotFoundError for ID: ${id instanceof Token ? id.name : id}`
      );
      throw e;
    }
  }
}
