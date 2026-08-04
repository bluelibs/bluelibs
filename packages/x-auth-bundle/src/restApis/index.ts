import { IXAuthBundleConfig } from "../defs";
import { REST_APIS } from "./apis";
import { XAuthService } from "../services/XAuthService";
import { HTTPBundle } from "@bluelibs/http-bundle";
import * as X from "@bluelibs/x-bundle";

const authPrefix = "/api/users";

export function injectRestAuthRoutes(
  config: IXAuthBundleConfig,
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
                input = (req as any).body;
              }
              const service = await container.get(XAuthService);
              const data = await service[api.service](input);
              return (res as any).json(data);
            } catch (err) {
              console.log(err);
              (res as any).json({
                message: `something wen wrong! with route ${api.name}`,
              });
            }
          }
        },
      });
    }
  }
}
