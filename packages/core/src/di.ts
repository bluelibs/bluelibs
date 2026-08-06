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

export { Inject, Token, ServiceIdentifier } from "typedi";

const SERVICE_META_STORAGE = Symbol("ServiceInfo");

// why: a decorator target may be any constructor — concrete or abstract.
// `new (...args: unknown[])` rejects classes with required params AND abstract
// classes (TS1238 when decorated), so `abstract new` is the wider, compatible
// shape. Consumers legitimately apply @Service() to abstract base classes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor = abstract new (...args: any[]) => unknown;

interface ServiceMetadataHolder<T> {
  [SERVICE_META_STORAGE]?: ServiceMetadata<T>;
}

export function Service<T = unknown>(
  options?: ServiceOptions<T>
): (target: Constructor) => void {
  return (targetConstructor): void => {
    const opts = options || {};

    const serviceMetadata: ServiceMetadata<T> = {
      // why: decorators only ever apply to concrete (instantiable) classes at
      // runtime, so the abstract-constructor target is safely narrowed here.
      id: opts.id || (targetConstructor as unknown as Constructable<T>),
      type: targetConstructor as unknown as Constructable<T>,
      factory: (opts as Partial<ServiceMetadata<T>>).factory || undefined,
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

    (targetConstructor as unknown as ServiceMetadataHolder<T>)[
      SERVICE_META_STORAGE
    ] = serviceMetadata;
  };
}

export class ContainerInstance extends BaseContainerInstance {
  get<T>(id: ServiceIdentifier<T>): T {
    // @ts-expect-error accessing internal method
    if (!this.has(id)) {
      const serviceMetadata = (id as unknown as ServiceMetadataHolder<T>)[
        SERVICE_META_STORAGE
      ];

      if (serviceMetadata) {
        // It's clearly a constructor
        this.set({
          ...serviceMetadata,
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
            type: id as unknown as Constructable<T>,
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
