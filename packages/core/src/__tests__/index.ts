import "reflect-metadata";
import * as chai from "chai";
import * as AsPromised from "chai-as-promised";

chai.use(AsPromised);

import "./utils/mergeDeep.test";
import "./DI.test";
import "./EventManager.test";
import "./Kernel.test";
import "./Bundle.test";
import "./Exception.test";
