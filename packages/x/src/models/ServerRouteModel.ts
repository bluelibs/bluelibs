import * as _ from "lodash";

export class ServerRouteModel {
  bundleName: string;
  path: string;
  name: string; // derived from path?
  type: "all" | "get" | "post" | "put";
}
