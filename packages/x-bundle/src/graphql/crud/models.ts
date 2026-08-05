import { QueryBodyType } from "@bluelibs/nova";
import { IDType } from "../../defs";

export class QueryInput {
  filters: {
    [key: string]: unknown;
  };
  options: QueryOptionsInput;
}

export class QueryOptionsInput {
  sort?: {
    [key: string]: 1 | -1;
  };
  limit?: number;
  skip?: number;
  sideBody?: QueryBodyType;
}

export class DocumentUpdateInput {
  _id: IDType;
  modifier: {
    [key: string]: unknown;
  };
}
