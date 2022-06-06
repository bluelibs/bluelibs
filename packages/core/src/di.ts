import {
  ContainerInstance as BaseContainerInstance,
  ServiceIdentifier,
  ServiceNotFoundError,
  Container,
  Service as BaseService,
  ServiceOptions,
  Constructable,
  ServiceMetadata,
  Token,
} from "typedi";

export { Inject, Token } from "typedi";

const SERVICE_META_STORAGE = Symbol("ServiceInfo");

export function Service<T = unknown>(
  options?: ServiceOptions<T>
): ClassDecorator {
  return targetConstructor => {
    options = options || {};

    const serviceMetadata: ServiceMetadata<T> = {
      id: options.id || targetConstructor,
      type: (targetConstructor as unknown) as Constructable<T>,
      factory: (options as any).factory || undefined,
      multiple: options.multiple || false,
      eager: options.eager || false,
      // @ts-ignore
      scope:
        // @ts-ignore
        options.scope ||
        (options.transient ? "transient" : null) ||
        "container",
      transient: options.transient || false,

      // @ts-ignore
      referencedBy: new Map().set(Container.id, Container),
    };

    targetConstructor[SERVICE_META_STORAGE] = serviceMetadata;
  };
}

export class ContainerInstance extends BaseContainerInstance {
  get<T>(id: ServiceIdentifier<T>): T {
    try {
      // @ts-ignore
      if (!this.has(id)) {
        if (id[SERVICE_META_STORAGE]) {
          // It's clearly a constructor
          this.set({
            ...id[SERVICE_META_STORAGE],
            id,
            type: id,
          });

          return super.get(id);
        }
      }

      try {
        return super.get(id);
      } catch (e) {
        // The reason we do this is to allow services that don't specify @Service()
        if (
          e instanceof ServiceNotFoundError ||
          e.toString() === "ServiceNotFoundError"
        ) {
          if (typeof id === "function") {
            // console.warn(
            //   `You have tried to get from the container a class (${id?.name}) which doesn't have @Service() specified. Please add it to remove this warning.`
            // );
            this.set({
              id: id as Function,
              type: id as any,
            });
            return super.get(id);
          }
        }

        throw e;
      }
    } catch (e) {
      const key = (id as any).name ? (id as any).name : id;
      e.ServiceNotFoundErrorChain = e.ServiceNotFoundErrorChain
        ? e.ServiceNotFoundErrorChain + " -> " + key
        : key;

      throw e;
    }
  }
}
