import * as _ from "lodash";

export class ServerlessConfigModel {
  service: string;
  provider: ProvidersEnum;
}
export enum ProvidersEnum {
  AWS_LAMBDA = "aws",
}
