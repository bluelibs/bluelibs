import { Bundle } from "./models/Bundle";
import { Kernel } from "./models/Kernel";
import { Event } from "./models/EventManager";

export interface IBundle<T = any> {
  setup(kernel: Kernel): Promise<void>;
  hook(): Promise<void>;
  prepare(): Promise<void>;
  init(): Promise<void>;
  get<K>(service: any): K;
  getConfig(): T;
  updateConfig(config: Partial<T>);
  setConfig(config: T);
}

export interface Constructor<T> {
  new (...args: any[]): T;
}

export type DeepPartial<T> = T extends null
  ? any
  : {
      [P in keyof T]?: DeepPartial<T[P]>;
    };

export interface IBundleConstructor<T = any> {
  new (...args: any[]): IBundle<T>;
}

export interface IServicesStore {
  [key: string]: any;
}

export interface IError {
  message: (data?: any) => string;
}

export enum KernelContext {
  DEVELOPMENT = "development",
  PRE_PRODUCTION = "pre-production",
  PRODUCTION = "production",
}

export enum KernelPhase {
  DORMANT = "dormant",
  BUNDLE_SETUP = "bundle-setup",
  HOOKING = "hooking",
  PREPARING = "preparing",
  INITIALISING = "initialising",
  INITIALISED = "initialised",
  FROZEN = INITIALISED,
  SHUTDOWN = "shutdown",
}

export enum BundlePhase {
  DORMANT = "dormant",
  SETUP = "setup",
  HOOKING = "hooking",
  HOOKED = "hooked",
  BEFORE_PREPARATION = "preparing",
  PREPARED = "prepared",
  BEFORE_INITIALISATION = "initialising",
  INITIALISED = "initialised",
  FROZEN = INITIALISED,
  SHUTDOWN = "shutdown",
}

export interface IKernelParameters {
  debug: boolean;
  /**
   * Are we currently in test mode, running our test suite?
   */
  testing: boolean;
  context: KernelContext;
  [key: string]: any;
}

export interface IKernelParametersPassable {
  testing?: boolean;
  context?: KernelContext;
  debug?: boolean;
  [key: string]: any;
}

export interface IKernelOptions {
  parameters?: IKernelParametersPassable;
  bundles?: Bundle<any>[];
}

export interface IEventConstructor<T = any> {
  new (...args: T extends null ? [] : [T]): Event<T>;
}

export type EventHandlerType<T = any> = (
  event: Event<T>
) => void | Promise<void>;

export type GlobalHandlerType<E, T> = (
  event: E,
  data: T
) => void | Promise<void>;

export interface IListenerStorage {
  order: number;
  filter?: (event: Event<any>) => boolean;
  handler: EventHandlerType;
}

export interface IEventHandlerOptions<T = any> {
  order?: number;
  filter?: (event: Event<T>) => boolean;
}
