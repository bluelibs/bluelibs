import { ContainerInstance } from "@bluelibs/core";
import { IEmailBundleConfig } from "../defs";
export declare function createEcosystem(config: Partial<IEmailBundleConfig>): Promise<ContainerInstance>;
