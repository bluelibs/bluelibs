import "reflect-metadata";
import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);

import "./utils/mergeDeep.test";
import "./DI.test";
import "./EventManager.test";
import "./Kernel.test";
import "./Bundle.test";
import "./Exception.test";
