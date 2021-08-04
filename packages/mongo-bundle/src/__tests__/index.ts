import * as chai from "chai";
import * as AsPromised from "chai-as-promised";

chai.use(AsPromised);

import "./services/Collection.test";
import "./services/DatabaseService.test";
import "./services/MigrationService.test";
import "./behaviors";

Error.stackTraceLimit = Infinity;
process.on("unhandledRejection", (reason, p) => {
  console.log("Unhandled Rejection at: Promise", p, "reason:", reason);
  // application specific logging, throwing an error, or other logic here
});
