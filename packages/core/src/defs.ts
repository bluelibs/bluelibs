import { Bundle } from "./models/Bundle";
import { Kernel } from "./models/Kernel";
import { Event } from "./models/EventManager";
import { ServiceIdentifier } from "./di";
import { ExecutionContext } from "./utils/modes";

export interface IBundle<T = unknown> {
  setup(kernel: Kernel): Promise<void>;
  hook(): Promise<void>;
  prepare(): Promise<void>;
  init(): Promise<void>;
  get<K>(service: ServiceIdentifier<K>): K;
  getConfig(): T;
  updateConfig(config: Partial<T>): void;
  setConfig(config: T): void;
}

// why: constructors may take arbitrary params; `new (...args: unknown[])` rejects classes with required params
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Constructor<T> {
  new (...args: any[]): T;
}

export type DeepPartial<T> = T extends null
  ? unknown
  : {
      [P in keyof T]?: DeepPartial<T[P]>;
    };

export interface IBundleConstructor<T = unknown> {
  // why: see Constructor above
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): IBundle<T>;
}

export interface IServicesStore {
  [key: string]: unknown;
}

export interface IError {
  message: (data?: unknown) => string;
}

export enum KernelContext {
  DEVELOPMENT = "development",
  PRE_PRODUCTION = "pre-production",
  PRODUCTION = "production",
}

export enum KernelPhase {
  DORMANT = "dormant",
  BUNDLE_SETUP = "bundle-setup",
  EXTENDING = "extending",
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
  EXTENDING = "extending",
  EXTENDED = "extended",
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
  /**
   * This refers to what release stage are you in: development, pre-production or production
   */
  context: KernelContext;
  executionContext: ExecutionContext;
  [key: string]: unknown;
}

export interface IKernelParametersPassable {
  testing?: boolean;
  context?: KernelContext;
  debug?: boolean;
  [key: string]: unknown;
}

export interface IKernelOptions {
  parameters?: IKernelParametersPassable;
  bundles?: Bundle<unknown>[];
}

export interface IEventConstructor<T = unknown> {
  new (...args: T extends null ? [] : [T]): Event<T>;
}

export type EventHandlerType<T = unknown> = (
  event: Event<T>
) => void | Promise<void>;

export type GlobalHandlerType<E, T> = (
  event: E,
  data: T
) => void | Promise<void>;

export interface IListenerStorage<T = unknown> {
  order: number;
  filter?: (event: Event<T>) => boolean;
  handler: EventHandlerType<T>;
}

export interface IEventHandlerOptions<T = unknown> {
  order?: number;
  filter?: (event: Event<T>) => boolean;
}
