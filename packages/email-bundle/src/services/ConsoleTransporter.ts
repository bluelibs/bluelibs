import { Transporter, Transport } from "nodemailer";

export const ConsoleTransporter: Transport = {
  name: "Console",
  version: "1.0.0",
  send(mail, callback) {
    console.log("[emails] You've sent a new email: \n", mail.data);
    callback(null, mail.data);
  },
};
