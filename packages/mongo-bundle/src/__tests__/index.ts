import "./services/Collection.test";
import "./services/DatabaseService.test";
import "./services/MigrationService.test";
import "./services/DeepSync.test";
import "./behaviors";

Error.stackTraceLimit = Infinity;
// process.on("unhandledRejection", (reason, p) => {
//   console.log("Unhandled Rejection at: Promise", p, "reason:", reason);
//   // application specific logging, throwing an error, or other logic here
// });
