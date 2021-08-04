import { QueryBodyType } from "@bluelibs/nova";

export class QueryInput {
  filters: {
    [key: string]: any;
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
  _id: any;
  modifier: {
    [key: string]: any;
  };
}
