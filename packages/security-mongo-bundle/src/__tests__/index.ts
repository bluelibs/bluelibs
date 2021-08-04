import * as chai from "chai";
import * as AsPromised from "chai-as-promised";

chai.use(AsPromised);

import "./ecosystem";
import "./services/PermissionService.test";
import "./services/SecurityService.test";
