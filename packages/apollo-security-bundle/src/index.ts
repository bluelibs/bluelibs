import "./declarations";
export * from "./ApolloSecurityBundle";
export * from "./exceptions";
export { Authenticator } from "./decorators/Authenticator";
export { PassportAuthenticator } from "./models/PassportAuthenticator";
export { PassportService } from "./services/PassportService";

import * as passport from "passport";
export { passport };
