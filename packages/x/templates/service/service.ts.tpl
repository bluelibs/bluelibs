import { Service, Inject, EventManager, ContainerInstance } from "@bluelibs/core";

@Service()
export class {{ serviceClass }} {
  constructor(
    {{# if injectContainer }}
      protected readonly container: ContainerInstance,
    {{/ if }}
    {{# if injectEventManager }}
      protected readonly eventManager: EventManager,
    {{/ if }}
  ) {}

  {{# each methodsArray }}
    public {{ this }}() {
      throw new Error("Not implemented, yet.");
    }
  {{/ each }}
}