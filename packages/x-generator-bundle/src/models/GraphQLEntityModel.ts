import { GenericModel } from "./GenericModel";
import { ModelRaceEnum } from "./defs";

export class GraphQLEntityModel {
  bundleName: string;
  genericModel: GenericModel = new GenericModel(
    "MyEntity",
    ModelRaceEnum.GRAPHQL_TYPE
  );
}
