import { Models, Writers } from "..";
import { UICollectionWriter } from "../writers/UICollectionWriter";
import { UICollectionCRUDWriter } from "../writers/UICollectionCRUDWriter";

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends null ? any : DeepPartial<T[P]>;
};

export type Resolvable<T> = T | (() => T) | string;
export type Cleanable<T, F> = T;

// TODO: something is fishy here. This doesn't really work
export type Resolved<T> = {
  [K in keyof T]: T[K] extends Resolvable<infer Q> ? Q : T[K];
};

export type RequireFields<T, K extends (keyof T)[]> = DeepPartial<T> &
  {
    [Z in K[number]]: T[Z];
  };

export type FactoryFunction<T, RT extends (keyof T)[] = null> = (
  data: RequireFields<T, RT>
) => T;

export type UIModeType = "list" | "create" | "edit" | "view" | "listFilters";

/**
 * If a collection has list enabled but no fields, it'll throw
 */
export const COLLECTION_UI_MODES_REQUIRES_FIELDS: UIModeType[] = [
  "list",
  "create",
  "edit",
  "view",
  "listFilters",
];

export type UIModeConfigType = { [key in UIModeType]?: boolean };

export type UICollectionConfigType =
  | false
  | ({
      label?: string;
      order?: number;
      delete?: boolean;
      /**
       * This is the icon name from @ant-design/icons. This will show-up in the menu
       */
      icon?: string;
    } & UIModeConfigType);

export type CrudGenerator =
  | {
      findOne?: boolean;
      find?: boolean;
      delete?: boolean;
      count?: boolean;
      insertOne?: boolean;
      updateOne?: boolean;
      deleteOne?: boolean;
      subscription?: boolean;
      subscriptionCount?: boolean;
    }
  | false;

export type UIFieldConfigType =
  | false
  | ({
      label?: string;
      order?: number;
      /**
       * Works with Ant Form
       */
      form?: {
        /**
         * The component from Ant
         */
        component: string;
        /**
         * The props passed to configuring the Ant component
         */
        props?: any;
      };
    } & UIModeConfigType);

export type UIConfigType =
  | false
  | ({
      label?: string;
      order?: number;
    } & UIModeConfigType);

export enum GeneratorKind {
  BACKEND_FIXTURES = "backend-fixtures",
  BACKEND_COLLECTIONS = "backend-collections",
  BACKEND_CRUDS = "backend-cruds",
  BACKEND_GRAPHQL = "backend-graphql",
  FRONTEND_COLLECTIONS = "frontend-collections",
  FRONTEND_CRUDS = "frontend-cruds",
  FRONTEND_BOILERPLATE_COMPONENTS = "frontend-boilerplate-components",
}

export type StudioWritersType = {
  microservice: Writers.MicroserviceWriter;
  collection: Writers.CollectionWriter;
  graphQLCRUD: Writers.GraphQLCRUDWriter;
  genericModel: Writers.GenericModelWriter;
  graphQLEntity: Writers.GraphQLEntityWriter;
  graphQLInput: Writers.GraphQLInputWriter;
  collectionLink: Writers.CollectionLinkWriter;
  uiCollection: UICollectionWriter;
  uiCollectionCRUD: UICollectionCRUDWriter;
  fixture: Writers.FixtureWriter;
};

export const ALL_GENERATORS = Object.values(GeneratorKind);

export type GenerateProjectOptionsType = {
  /**
   * Specify the available generators. You can import `ALL_GENERATORS` if you want to filter specific ones easily and work with GeneratorKind
   */
  generators: GeneratorKind[];
  /**
   * This will override all files that it generates. Typically some files are ignored, in this case no. We recommend committing all your work before running it with this option as it may have unintended side-effects.
   * @danger
   */
  override: boolean;
  /**
   * Writers are what write from models to the file system. You have the flexibility of creating your own. Easiest way to do this is just to look at the source and see what's going on under the hood.
   */
  writers: Partial<StudioWritersType>;

  /**
   * The path where the project will be generated, it uses the current working directory by default
   */
  projectPath: string;
  /**
   * Install npm dependencies
   * @defaults true
   */
  installNpmDependencies: boolean;
  /**
   * Whether you see the logs or not
   * @default true
   */
  verbose: boolean;
};
