"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IMPLICIT_TRANSPORTS = exports.EMAIL_DEFAULTS = exports.NODEMAILER_TEST_MODE = exports.NODEMAILER_INSTANCE = void 0;
const core_1 = require("@bluelibs/core");
exports.NODEMAILER_INSTANCE = new core_1.Token();
exports.NODEMAILER_TEST_MODE = new core_1.Token();
exports.EMAIL_DEFAULTS = new core_1.Token();
exports.IMPLICIT_TRANSPORTS = ["console", "nodemailer-test"];
//# sourceMappingURL=constants.js.map