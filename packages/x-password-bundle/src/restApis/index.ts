import { IXPasswordBundleConfig } from "../defs";
import { REST_APIS } from "./apis";
import { XPasswordService } from "../services/XPasswordService";
import { HTTPBundle } from "@bluelibs/http-bundle";
import * as X from "@bluelibs/x-bundle";

const authPrefix = "/api/users";

export function injectRestAuthRoutes(
  config: IXPasswordBundleConfig,
  httpBundle: HTTPBundle
): any {
  //add routes just on demand
  const apis = REST_APIS.filter((api) => config.rest[api.name]);
  if (apis.length > 0) {
    for (let api of apis) {
      httpBundle.addRoute({
        type: api.type,
        path: authPrefix + api.path,
        async handler(container, req, res, next) {
          if (api.handler) {
            api.handler(container, req, res, next);
          } else {
            try {
              let input;
              if (api.type !== "get") {
                input = req.body;
              }
              const service = await container.get(XPasswordService);
              const data = await service[api.service](input);
              return res.json(data);
            } catch (err) {
              console.log(err);
              res.json({
                message: `something wen wrong! with route ${api.name}`,
              });
            }
          }
        },
      });
    }
  }
}
