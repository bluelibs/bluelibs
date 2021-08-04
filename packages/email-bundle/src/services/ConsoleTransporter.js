"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleTransporter = void 0;
exports.ConsoleTransporter = {
    name: "Console",
    version: "1.0.0",
    send(mail, callback) {
        console.log("[emails] You've sent a new email: \n", mail.data);
        callback(null, mail.data);
    },
};
//# sourceMappingURL=ConsoleTransporter.js.map