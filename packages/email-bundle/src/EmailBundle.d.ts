import { Bundle } from "@bluelibs/core";
import { IEmailBundleConfig } from "./defs";
import { LoggerBundle } from "@bluelibs/logger-bundle";
export declare class EmailBundle extends Bundle<IEmailBundleConfig> {
    dependencies: (typeof LoggerBundle)[];
    protected defaultConfig: IEmailBundleConfig;
    prepare(): Promise<void>;
    private getTransporter;
    getTestAccountInfo(): Promise<{
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
    }>;
    /**
     * Set the transporter before preparation of the bundle
     *
     * @param transporter
     */
    setTransporter(transporter: any): void;
}
