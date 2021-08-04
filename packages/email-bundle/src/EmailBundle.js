"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailBundle = void 0;
const core_1 = require("@bluelibs/core");
const constants_1 = require("./constants");
const nodemailer = require("nodemailer");
const logger_bundle_1 = require("@bluelibs/logger-bundle");
const ConsoleTransporter_1 = require("./services/ConsoleTransporter");
class EmailBundle extends core_1.Bundle {
    constructor() {
        super(...arguments);
        this.dependencies = [logger_bundle_1.LoggerBundle];
        this.defaultConfig = {
            transporter: "console",
            defaults: {
                from: `"BlueLibs" <no-reply@bluelibs.org>`,
                props: {},
            },
        };
    }
    async prepare() {
        let { transporter } = this.config;
        if (transporter === null) {
            this.container.set(constants_1.NODEMAILER_INSTANCE, null);
        }
        else {
            this.container.set(constants_1.NODEMAILER_INSTANCE, nodemailer.createTransport(await this.getTransporter(transporter)));
        }
        this.container.set(constants_1.NODEMAILER_TEST_MODE, false);
        this.container.set(constants_1.EMAIL_DEFAULTS, this.config.defaults);
    }
    async getTransporter(transporter) {
        if (transporter === "console") {
            return ConsoleTransporter_1.ConsoleTransporter;
        }
        const logger = this.container.get(logger_bundle_1.LoggerService);
        if (transporter === "nodemailer-test") {
            try {
                logger.info("Creating email test account");
                transporter = await this.getTestAccountInfo();
                this.container.set(constants_1.NODEMAILER_TEST_MODE, true);
                return transporter;
            }
            catch (err) {
                logger.warning(`We could not create a nodemailer test account. All emails will be logged in console.`);
                return ConsoleTransporter_1.ConsoleTransporter;
            }
        }
        return transporter;
    }
    async getTestAccountInfo() {
        const testAccount = await nodemailer.createTestAccount();
        return {
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass, // generated ethereal password
            },
        };
    }
    /**
     * Set the transporter before preparation of the bundle
     *
     * @param transporter
     */
    setTransporter(transporter) {
        if (this.phase === core_1.BundlePhase.BEFORE_PREPARATION) {
            this.updateConfig({
                transporter,
            });
        }
        else {
            throw new Error("Please modify the transporter in the BundleBeforePrepareEvent");
        }
    }
}
exports.EmailBundle = EmailBundle;
//# sourceMappingURL=EmailBundle.js.map