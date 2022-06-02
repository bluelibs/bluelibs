import { Bundle, ContainerInstance, Kernel } from "@bluelibs/core";
import { OrderedList } from "@bluelibs/ordered-lists";
import { setDefaults } from "@bluelibs/smart";
import {
  Components,
  IXUIReactBundleConfigType,
  WrapperComponentType,
  WrapperType,
  XUI_COMPONENTS_TOKEN,
} from ".";
import { IComponents } from "./react/components";

let smartContainer: ContainerInstance;

setDefaults({
  factory(targetType) {
    if (!smartContainer || !smartContainer?.get(Kernel)?.isInitialised()) {
      console.error("You are trying to access kernel before it's initialised");
    }
    return smartContainer.get(targetType);
  },
});

export class XUIReactBundle extends Bundle<IXUIReactBundleConfigType> {
  protected defaultConfig: IXUIReactBundleConfigType = {
    wrappers: [],
    components: {},

    initialisingComponent: Components.Loading,
  };

  private static providerWrappers = new OrderedList<WrapperType<any>>();

  get wrappers(): WrapperComponentType<any>[] {
    return XUIReactBundle.providerWrappers.elements();
  }

  async prepare() {
    this.addWrappers(this.config.wrappers);
  }

  public addWrapper<T>(wrapper: WrapperType<T>) {
    XUIReactBundle.providerWrappers.add(wrapper, wrapper.order);
  }

  public addWrappers(wrappers: WrapperType<any>[]) {
    wrappers.map((wrapper) => this.addWrapper(wrapper));
  }

  async init() {
    this.container.set(
      XUI_COMPONENTS_TOKEN,
      Object.assign({}, Components, this.config.components)
    );

    smartContainer = this.container;
  }

  /**
   * Use this in the prepare or init phase to update certain UI Components
   * @param components
   */
  updateComponents(components: Partial<IComponents>) {
    const config = Object.assign({}, this.config.components, components);

    this.config.components = config;
  }
}
