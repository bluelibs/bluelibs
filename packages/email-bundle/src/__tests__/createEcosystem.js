"use strict";
// Create a kernel with a bundle
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEcosystem = void 0;
const core_1 = require("@bluelibs/core");
const EmailBundle_1 = require("../EmailBundle");
const logger_bundle_1 = require("@bluelibs/logger-bundle");
async function createEcosystem(config) {
    const kernel = new core_1.Kernel({
        bundles: [new logger_bundle_1.LoggerBundle(), new EmailBundle_1.EmailBundle(config)],
        parameters: {
            testing: true,
        },
    });
    await kernel.init();
    return kernel.container;
}
exports.createEcosystem = createEcosystem;
//# sourceMappingURL=createEcosystem.js.map