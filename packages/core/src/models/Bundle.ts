import { Kernel } from "./Kernel";
import { ContainerInstance } from "typedi";
import { mergeDeep } from "../utils/mergeDeep";
import {
  IBundle,
  BundlePhase,
  IBundleConstructor,
  DeepPartial,
  Constructor,
} from "../defs";
import {
  BundleDependencyException,
  BundleFrozenException,
} from "../exceptions";
import { EventManager } from "./EventManager";

/**
 * @template T this represents the final configuration of the bundle accessible via bundle.config
 * @template R this represents the required configuration that must be provided when instantiating the bundle
 */
export abstract class Bundle<T = any, R = null> implements IBundle<T> {
  /**
   * Dev Note:
   * We haven't made defaultConfig static because we want by default to use Partial<T>
   * and static variables cannot reference class type parameters (TS2302)
   */
  protected defaultConfig: DeepPartial<T>;
  /**
   * The config provided by the instantiation of the bundle is stored inside requiredConfig
   */
  protected requiredConfig: R | DeepPartial<T>;
  protected config: T;
  protected kernel: Kernel;
  protected phase: BundlePhase = BundlePhase.DORMANT;

  /**
   * @deprecated Please use `addDependency`
   */
  public readonly dependencies: Array<IBundleConstructor<any>> = [];

  /**
   * The logic here is like this, if there's a Required (R) set of config then we oblige the user to enter it in the constructor
   * If not we allow him to *optionally* enter a partial of the final configuration (T)
   *
   * @param args.0 Configuration for this bundle
   */
  constructor(...args: R extends null ? [DeepPartial<T>?] : [R]) {
    if (args.length && args[0]) {
      this.requiredConfig = args[0];
    }
  }

  public setKernel(_kernel: Kernel) {
    this.kernel = _kernel;
  }

  public async addDependency<K>(
    bundleClass: Constructor<Bundle<K>>,
    config?: K
  ) {
    if (this.kernel.hasBundle(bundleClass)) return;

    const bundle = new bundleClass(config || {});

    this.kernel.addBundle(bundle);

    await bundle.setup();
  }

  public async setup() {
    // Note: we do this here because defaultConfig gets the value after construction()
    const config: any = {};
    mergeDeep(config, this.defaultConfig, this.requiredConfig);
    this.config = config;
    await this.validate(this.config);

    // Check dependencies
    this.dependencies.forEach(dependency => {
      if (!this.kernel.hasBundle(dependency)) {
        throw new BundleDependencyException({
          requiredBundle: dependency.name,
        });
      }
    });
  }

  get container(): ContainerInstance {
    return this.kernel.container;
  }

  get eventManager(): EventManager {
    return this.container.get(EventManager);
  }

  // Here you can extend the kernel by adding dependencies
  // Use addDependency()

  public async extend() {}

  // validate this.config, based on T
  public async validate(config?: T) {}

  // Gives the chance to: listen to other bundle events
  public async hook(): Promise<void> {}

  // There is an intermediary preparation phase which
  public async prepare(): Promise<void> {}

  // Here you bind your services, register application-level listeners
  public async init(): Promise<void> {}

  // When shutting down kernel, all bundles shutdown
  // This is most likely used when testing to avoid hanging processes
  public async shutdown(): Promise<void> {}

  /**
   * Returns the service by its id
   * @param serviceId
   */
  public get<T = any>(serviceId: any): T {
    return this.container.get<T>(serviceId);
  }

  /**
   * Updates the config using deep merge strategy
   * @param config
   */
  public updateConfig(config: Partial<T>) {
    this.config = mergeDeep(this.config, config);
  }

  /**
   * Overrides the config
   * @param config
   */
  public setConfig(config: T) {
    this.config = config;
  }

  /**
   * Provides you the configuration of the bundle
   */
  public getConfig(): T {
    return this.config;
  }

  /**
   * Instantiates the services as they most likely need to be ready and not lazy-loaded.
   * If the service has an initialisation function (init), it will be run
   * @param services
   */
  protected async warmup(services: Array<any>) {
    for (let i = 0; i < services.length; i++) {
      const serviceClass = services[i];
      const initialisable = this.container.get<any>(serviceClass);

      // If it contains an init function just run it as well
      if (initialisable.init) {
        await initialisable.init();
      }
    }
  }

  /**
   * Do not call this yourself as you may break stuff, this should only be called by the Kernel.
   * @param phase
   */
  public setPhase(phase: BundlePhase) {
    if (this.phase === BundlePhase.FROZEN && phase !== BundlePhase.SHUTDOWN) {
      throw new BundleFrozenException();
    }

    this.phase = phase;
  }

  /**
   * For accessing public bundle's phases
   */
  public getPhase(): BundlePhase {
    return this.phase;
  }
}
