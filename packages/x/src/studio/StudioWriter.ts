import {
  BlueprintWriter,
  IBlueprintWriterSession,
} from "@bluelibs/terminal-bundle";
import { FSOperator, XElements, XSession, XElementType, FSUtils } from "..";
import * as Studio from ".";
import { Models, Writers } from "..";
import * as fs from "fs";
import * as path from "path";
import { UICollectionWriter } from "../writers/UICollectionWriter";
import { UICollectionModel } from "../models/UICollectionModel";
import { UICRUDModel } from "../models/UICRUDModel";
import { UICollectionCRUDWriter } from "../writers/UICollectionCRUDWriter";
import { XBridge } from "./bridge/XBridge";
import { Fixturizer } from "./bridge/Fixturizer";
import { XElementClassSuffix } from "../utils/XElements";
import { CollectionReducerWriter } from "../writers/CollectionReducerWriter";
import { CollectionReducerModel } from "../models/CollectionReducerModel";
import { chalk } from "@bluelibs/terminal-bundle";
import {
  ALL_GENERATORS,
  GenerateProjectOptionsType,
  GeneratorKind,
  StudioWritersType,
} from "./defs";
import { ContainerInstance } from "@bluelibs/core";
import {
  EnumConfigType,
  FrontendReactMicroserviceModel,
  ModelRaceEnum,
} from "../models";
import { execSync, spawnSync } from "child_process";
import { GenericModelEnumWriter } from "../writers/GenericModelEnumWriter";
import { GraphQLEnumWriter } from "../writers/GraphQLEnumWriter";

const ADMIN_FOLDER = "admin";
const API_FOLDER = "api";

export class StudioWriter {
  public readonly session: XSession;
  public readonly options: GenerateProjectOptionsType;

  constructor(
    protected readonly container: ContainerInstance,
    protected readonly model: Studio.App,
    options: Partial<GenerateProjectOptionsType>
  ) {
    options = options || {};
    options.writers = options.writers || {};
    options.writers = Object.assign(
      {},
      this.getWriterDefaults(),
      options.writers
    );

    if (!options.generators) {
      options.generators = ALL_GENERATORS;
    }
    if (options.installNpmDependencies === undefined) {
      options.installNpmDependencies = true;
    }
    if (options.verbose === undefined) {
      options.verbose = true;
    }

    this.options = options as GenerateProjectOptionsType;
    this.session = container.get(XSession);

    if (options.override) {
      this.session.isOverrideMode = true;
    }
  }

  protected getWriterDefaults(): StudioWritersType {
    return {
      microservice: this.container.get(Writers.MicroserviceWriter),
      collection: this.container.get(Writers.CollectionWriter),
      graphQLCRUD: this.container.get(Writers.GraphQLCRUDWriter),
      graphQLEntity: this.container.get(Writers.GraphQLEntityWriter),
      graphQLInput: this.container.get(Writers.GraphQLInputWriter),
      collectionLink: this.container.get(Writers.CollectionLinkWriter),
      uiCollection: this.container.get(UICollectionWriter),
      uiCollectionCRUD: this.container.get(UICollectionCRUDWriter),
      fixture: this.container.get(Writers.FixtureWriter),
      genericModel: this.container.get(Writers.GenericModelWriter),
    };
  }

  get writers(): StudioWritersType {
    return this.options.writers as StudioWritersType;
  }

  hasGenerator(kind: GeneratorKind) {
    return this.options.generators.includes(kind);
  }

  async write() {
    const session = this.session;
    const studioApp = this.model;
    this.model.clean();

    const commit = () =>
      this.session.commit({ verbose: false, skipInstructions: true });

    if (!this.model.find.collection("Users")) {
      throw new Error(
        'You do not have a "Users" collection added. We cannot continue without one.'
      );

      return;
    }

    const projectPath = this.options.projectPath || process.cwd();
    let firstTimeGeneration = false;
    session.setProjectPath(projectPath);

    // BACKEND
    const backendMicroservicePath = path.join(
      projectPath,
      "microservices",
      API_FOLDER
    );

    session.setMicroservicePath(backendMicroservicePath);
    if (!fs.existsSync(backendMicroservicePath)) {
      firstTimeGeneration = true;
      await this.createBackendMicroservice(studioApp, session, commit);
    } else {
      this.skipping(`Backend microservice already exists.`);
    }

    if (this.hasGenerator(GeneratorKind.BACKEND_COLLECTIONS)) {
      await this.createCollections(studioApp, session, commit);
      await this.createSharedModels(studioApp, session, commit);
      await this.addReducersToUsers(session);
      await this.createRelations(studioApp, session, commit);
      await this.createReducers(studioApp, session, commit);
    }
    if (this.hasGenerator(GeneratorKind.BACKEND_CRUDS)) {
      await this.createGraphQLCRUDs(studioApp, session, commit);
    }
    if (this.hasGenerator(GeneratorKind.BACKEND_FIXTURES)) {
      await this.createFixtures(studioApp, session, commit);
    }

    // FRONTEND
    const frontendMicroservicePath = path.join(
      projectPath,
      "microservices",
      ADMIN_FOLDER
    );

    session.setMicroservicePath(frontendMicroservicePath);
    const hasExistingFrontendMicroservice = fs.existsSync(
      frontendMicroservicePath
    );
    if (!hasExistingFrontendMicroservice) {
      await this.createFrontendMicroservice(studioApp, session, commit);
    } else {
      this.skipping(`Frontend microservice already exists.`);
    }

    session.setMicroservicePath(frontendMicroservicePath);

    if (this.hasGenerator(GeneratorKind.FRONTEND_COLLECTIONS)) {
      await this.createUICollections(studioApp, session, commit);
    }
    if (this.hasGenerator(GeneratorKind.FRONTEND_CRUDS)) {
      await this.createUICRUDs(studioApp, session, commit);
    }
    if (
      !hasExistingFrontendMicroservice &&
      this.hasGenerator(GeneratorKind.FRONTEND_BOILERPLATE_COMPONENTS)
    ) {
      await this.createBoilerplateUIComponents(studioApp, session, commit);
    }

    await this.setupI18NGenerics(studioApp, session, commit);

    if (this.options.installNpmDependencies) {
      this.ensureNpmDependencies(projectPath, firstTimeGeneration);
    }
  }

  /**
   * Install all dependencies necessary
   */
  protected ensureNpmDependencies(projectPath, firstTimeGeneration: boolean) {
    console.log("");

    this.loading("Installing npm dependencies for api");
    execSync("npm install", {
      cwd: path.join(projectPath, "microservices", "api"),
      stdio: "inherit",
    });

    this.loading("Installing npm dependencies for admin");
    execSync("npm install", {
      cwd: path.join(projectPath, "microservices", "api"),
      stdio: "inherit",
    });

    console.log("");
    this.success("Done. Now you can use:");
    console.log("");
    console.log("$ npm run start:api");
    console.log("$ npm run start:admin");
    if (firstTimeGeneration) {
      console.log(
        "Note: wait for the `api` to start before running the `admin` microservice to ensure GraphQL types are in-sync."
      );
    }

    console.log("");
  }

  async setupI18NGenerics(
    model: Studio.App,
    session: XSession,
    commit: () => Promise<void>
  ) {
    const operator = new FSOperator(session, {});
    const tpl = operator.getTemplatePathCreator("blueprint");

    const bundleDir = FSUtils.bundlePath(
      session.getMicroservicePath(),
      "UIAppBundle"
    );
    // I18N
    operator.sessionCopy(
      tpl("ui/i18n/generics.json"),
      path.join(bundleDir, "i18n", "generics.json")
    );
    operator.sessionPrependFile(
      path.join(bundleDir, "i18n", "store.ts"),
      `import generics from "./generics.json";`
    );
    operator.sessionAppendFile(
      path.join(bundleDir, "i18n", "store.ts"),
      `i18n.push(generics);`
    );

    await commit();
  }

  async createBoilerplateUIComponents(
    model: Studio.App,
    session: XSession,
    commit: () => Promise<void>
  ) {
    this.success(`Performing final UI Preparations ...`);

    const operator = new FSOperator(session, {});
    const tpl = operator.getTemplatePathCreator("blueprint");

    const bundleDir = FSUtils.bundlePath(
      session.getMicroservicePath(),
      "UIAppBundle"
    );
    const pagesDir = path.join(bundleDir, "pages");

    // CUSTOM HOME
    // TODO: Change the way we perform this extension
    operator.sessionCopy(
      tpl("ui/components/Home.tsx"),
      path.join(pagesDir, "Home", "Home.tsx"),
      {
        ignoreIfContains: "This is your application",
      }
    );
    operator.sessionCopy(
      tpl("ui/components/routes.tsx"),
      path.join(pagesDir, "Home", "routes.tsx"),
      {
        ignoreIfExists: true,
      }
    );

    this.success(`Added custom home page.`);

    // OVERRIDES
    const overridesDir = path.join(bundleDir, "overrides");
    operator.sessionCopy(tpl("ui/overrides"), overridesDir, {
      ignoreIfExists: true,
    });

    ["AdminTopHeader", "NotAuthorized", "Loading", "NotFound"].forEach(
      (componentName) => {
        operator.sessionAppendFile(
          path.join(overridesDir, "index.ts"),
          `export * from "./${componentName}"`
        );
        this.success(`Added override for ${componentName}`);
      }
    );

    // DASHBOARD & AUTH
    operator.sessionCopy(
      tpl("ui/dashboard"),
      path.join(pagesDir, "Dashboard"),
      {
        ignoreIfExists: true,
      }
    );
    this.success(`Added custom dashboard.`);

    operator.sessionCopy(tpl("ui/authentication"), pagesDir, {
      ignoreIfExists: true,
    });
    this.success(`Added authentication components`);

    operator.sessionPrependFile(
      path.join(pagesDir, "styles.scss"),
      `@import "./Authentication/styles.scss";`
    );

    operator.sessionAppendFile(
      path.join(pagesDir, "routes.tsx"),
      `export * from "./Dashboard/routes";`
    );

    operator.sessionAppendFile(
      path.join(pagesDir, "routes.tsx"),
      `export * from "./Home/routes";`
    );
    operator.sessionAppendFile(
      path.join(pagesDir, "routes.tsx"),
      `export * from "./Authentication/routes";`
    );

    operator.sessionCopy(
      tpl("ui/styles/style.scss"),
      path.join(bundleDir, "styles", "admin.scss"),
      { ignoreIfExists: true }
    );

    operator.sessionAppendFile(
      path.join(bundleDir, "styles", "styles.scss"),
      `@import "./admin.scss";`
    );

    await commit();
  }

  async createUICRUDs(
    studioApp: Studio.App,
    session: XSession,
    commit: () => Promise<void>
  ) {
    const writer = this.writers.uiCollectionCRUD;

    studioApp.collectionsToWrite.forEach((collection) => {
      if (collection.ui === false) {
        return;
      }
      if (collection.isExternal()) {
        return;
      }

      const model = new UICRUDModel();
      model.bundleName = "UIAppBundle";
      model.studioCollection = collection;
      model.features = collection.ui;

      writer.write(model, session);
      this.success(`(UI) Created CRUD interfaces for: "${collection.id}"`);
    });

    await commit();
  }

  async createUICollections(
    studioApp: Studio.App,
    session: XSession,
    commit: () => Promise<void>
  ) {
    const writer = this.writers.uiCollection;

    studioApp.collectionsToWrite
      .filter((c) => c.hasGraphQL("entity"))
      .forEach((collection) => {
        if (collection.isExternal()) {
          return;
        }

        const model = new UICollectionModel();
        model.bundleName = "UIAppBundle";
        model.hasCustomInputs = true;
        model.studioCollection = collection;
        model.collectionName = collection.id;
        model.collectionEndpoint = collection.id;
        model.entityName = collection.entityName;

        writer.write(model, session);
        this.success(`(UI) Created client-side collection: "${collection.id}"`);
      });

    await commit();
  }

  private async createFixtures(
    studioApp: Studio.App,
    session: XSession,
    commit: () => Promise<void>
  ) {
    const fixturesWriter = this.writers.fixture;
    const fixturesModel = new Models.FixtureModel();
    const fixturizer = new Fixturizer(studioApp);
    fixturesModel.bundleName = "AppBundle";
    fixturesModel.fixtureName = "app";
    fixturesModel.dataMapMode = true;
    fixturesModel.dataMap = fixturizer.getDataSet();

    fixturesWriter.write(fixturesModel, session);

    await commit();

    this.success(`Successfully created fixtures for data set.`);
  }

  private async createGraphQLCRUDs(
    studioApp: Studio.App,
    session: XSession,
    commit: () => Promise<void>
  ) {
    const microservicePath = session.getMicroservicePath();
    const crudWriter = this.writers.graphQLCRUD;
    for (const collection of studioApp.collections) {
      if (!collection.hasGraphQL("crud") || !collection.crud) {
        continue;
      }
      if (collection.isExternal()) {
        continue;
      }
      const model = new Models.GraphQLCRUDModel();
      model.bundleName = "AppBundle";
      model.checkLoggedIn = false;
      model.hasSubscriptions = true;
      model.crudName = collection.id;
      model.crudOperations = collection.crud;
      model.collectionElement = XElements.emulateElement(
        microservicePath,
        "AppBundle",
        XElementType.COLLECTION,
        collection.id
      );
      model.graphqlEntityElement = XElements.emulateElement(
        microservicePath,
        "AppBundle",
        XElementType.GRAPHQL_ENTITY,
        collection.entityName
      );

      // TODO: maybe allow-opt-in somehow?
      model.hasCustomInputs = true;

      // Shorthand function to eliminate code-repetition below
      function createModel(ui: "edit" | "create") {
        return XBridge.collectionToGenericModel(collection, {
          graphql: true,
          // skipRelations: true,
          ui,
          isInput: true,
        });
      }

      model.insertInputModelDefinition = createModel("create");
      model.updateInputModelDefinition = createModel("edit");

      // Make all fields optional for the update. We want to enable atomic-size updates from day 0.
      model.updateInputModelDefinition.fields.forEach((field) => {
        field.isOptional = true;
        field.defaultValue = undefined;
      });

      crudWriter.write(model, session);
      await commit();

      this.success(
        `Created complete GraphQL CRUD interface for ${collection.id}`
      );
    }
  }

  private async createRelations(
    studioApp: Studio.App,
    session: XSession,
    commit: () => Promise<void>
  ) {
    const microservicePath = session.getMicroservicePath();
    const linkWriter = this.writers.collectionLink;

    for (const collection of studioApp.collectionsToWrite) {
      for (const _relation of collection.relations) {
        const relation = _relation.cleaned;

        const model = new Models.CollectionLinkModel();
        // For inversed links
        model.fieldName = relation.field && relation.field.id;
        model.type = relation.isMany ? "manyToMany" : "manyToOne";

        if (relation.unique) {
          model.type = "oneToOne";
        }

        model.collectionAElement = XElements.emulateElement(
          microservicePath,
          "AppBundle",
          XElementType.COLLECTION,
          collection.id
        );

        if (relation.to.isExternal()) {
          model.collectionBElement = {
            type: XElementType.COLLECTION,
            identityNameRaw: relation.to.id,
            identityName:
              relation.to.id + XElementClassSuffix[XElementType.COLLECTION],
            isExternal: true,
            absolutePath: relation.to.externalPackage,
            importablePath: relation.to.externalPackage,
          };
        } else {
          model.collectionBElement = XElements.emulateElement(
            microservicePath,
            "AppBundle",
            XElementType.COLLECTION,
            relation.to.id
          );
        }

        model.whereIsTheLinkStored = relation.isDirect ? "A" : "B";
        model.linkFromA = relation.id;
        model.linkFromB = relation.inversedBy;
        model.shouldProcessB = false;

        linkWriter.write(model, session);

        this.success(
          `Linked collection: "${collection.id}:${relation.id}" to -> "${relation.to.id}"`
        );

        await commit();
      }
    }

    await commit();
  }

  protected async createReducers(
    studioApp: Studio.App,
    session: XSession,
    commit: () => Promise<void>
  ) {
    const microservicePath = session.getMicroservicePath();
    const reducerWriter = this.container.get(CollectionReducerWriter);

    for (const collection of studioApp.collectionsToWrite) {
      collection.fields
        .filter((f) => f.isReducer)
        .forEach((field) => {
          const reducerModel = new CollectionReducerModel();
          reducerModel.bundleName = "AppBundle";
          reducerModel.collectionName = collection.id;
          reducerModel.dependency = field.reducerDependency;
          reducerModel.name = field.id;

          reducerWriter.write(reducerModel, session);
        });
    }

    await commit();
  }

  protected async createSharedModels(
    studioApp: Studio.App,
    session: XSession,
    commit: () => Promise<void>
  ) {
    const pathsInfo = XBridge.getPathInfos();
    const genericModelWriter = this.writers.genericModel;
    const graphqlEntityWriter = this.writers.graphQLEntity;
    const graphqlInputWriter = this.writers.graphQLInput;
    const genericModelEnumWriter = this.container.get(GenericModelEnumWriter);

    const bundleDir = FSUtils.bundlePath(
      session.getMicroservicePath(),
      "AppBundle"
    );

    const sharedModelsPath = path.join(
      bundleDir,
      ...pathsInfo.sharedModelPathInBundle.split("/")
    );

    for (const model of studioApp.sharedModels) {
      if (model.isEnum()) {
        genericModelEnumWriter.write(
          {
            className: model.id,
            elements: model.enumValues as EnumConfigType[],
            targetPath: sharedModelsPath,
          },
          session
        );
        const fsOperator = new FSOperator(session, model);

        fsOperator.sessionAppendFile(
          path.join(sharedModelsPath, "index.ts"),
          `export * from "./${model.id}"`
        );
        fsOperator.sessionAppendFile(
          path.join(bundleDir, "collections", "index.ts"),
          `export * from "./shared"`
        );
        const graphqlEnumWriter = this.container.get(GraphQLEnumWriter);
        graphqlEnumWriter.write(
          {
            className: model.id,
            description: model.description,
            elements: model.enumValues as EnumConfigType[],
            targetPath: path.join(bundleDir, "graphql", "entities", model.id),
          },
          session
        );

        // STOP AND CONTINUE
        continue;
      }

      const genericModel = new Models.GenericModel(model.id);

      genericModel.name = model.id;
      genericModel.yupValidation = true;

      model.fields.forEach((field) => {
        genericModel.addField(XBridge.fieldToGenericField(field));
      });

      genericModel.targetPath = path.join(sharedModelsPath, `${model.id}.ts`);
      genericModelWriter.write(genericModel, session);

      await commit();

      const fsOperator = new FSOperator(session, model);
      fsOperator.sessionAppendFile(
        path.join(sharedModelsPath, "index.ts"),
        `export * from "./${genericModel.name}"`
      );
      fsOperator.sessionAppendFile(
        path.join(bundleDir, "collections", "index.ts"),
        `export * from "./shared"`
      );

      if (model.enableGraphQL) {
        const genericTypeModel = new Models.GenericModel(model.id);
        const genericInputModel = new Models.GenericModel(model.id);
        genericTypeModel.name = model.id;
        genericInputModel.name = model.id;
        genericTypeModel.yupValidation = true;
        genericInputModel.yupValidation = true;

        model.fields.forEach((field) => {
          genericInputModel.addField(
            XBridge.fieldToGenericField(field, true, model.id)
          );
          genericTypeModel.addField(
            XBridge.fieldToGenericField(field, false, model.id)
          );
        });

        const graphqlTypeModel = new Models.GraphQLInputModel();
        graphqlTypeModel.bundleName = "AppBundle";
        graphqlTypeModel.genericModel =
          Models.GenericModel.clone(genericTypeModel);
        graphqlTypeModel.genericModel.race = ModelRaceEnum.GRAPHQL_TYPE;

        graphqlEntityWriter.write(graphqlTypeModel, session);

        const graphqlInputModel = new Models.GraphQLInputModel();
        graphqlInputModel.bundleName = "AppBundle";
        graphqlInputModel.genericModel = genericInputModel;
        graphqlInputModel.genericModel.race = ModelRaceEnum.GRAPHQL_INPUT;
        graphqlInputModel.genericModel.isBaseExtendMode = true;
        graphqlInputModel.genericModel.reuseEnums = true;
        graphqlInputModel.genericModel.isInputMode = true;

        graphqlInputWriter.write(graphqlInputModel, session);
      }
    }

    await commit();
  }

  protected async createCollections(
    studioApp: Studio.App,
    session: XSession,
    commit: () => Promise<void>
  ) {
    const collectionWriter = this.writers.collection;
    // Create collections on the backend.
    for (const collection of studioApp.collectionsToWrite) {
      // Ignore external collections
      if (collection.isExternal()) {
        continue;
      }

      const collectionModel = new Models.CollectionModel();
      const genericModel = XBridge.collectionToGenericModel(collection);
      genericModel.ensureIdField();

      if (collection.id === "Users") {
        collectionModel.customCollectionImport =
          "@bluelibs/security-mongo-bundle";
        collectionModel.customCollectionName = "UsersCollection";
        this.prepareUserModel(genericModel);
      }

      collectionModel.modelDefinition = genericModel;
      collectionModel.hasSubscriptions = true;
      collectionModel.isTimestampable = collection.behaviors.timestampable;
      collectionModel.isSoftdeletable = collection.behaviors.softdeletable;
      collectionModel.isBlameable = collection.behaviors.blameable;
      collectionModel.validateAgainstModel = collection.behaviors.validate;
      collectionModel.isEntitySameAsModel = false;
      collectionModel.collectionName = collection.id;
      collectionModel.bundleName = "AppBundle";
      collectionModel.createEntity = false;
      collectionModel.overrideCollectionIfExists = false;

      if (collection.hasGraphQL("entity")) {
        const graphQLModel = XBridge.collectionToGenericModel(collection, {
          graphql: true,
        });
        collectionModel.createEntity = true;
        collectionModel.entityDefinition = graphQLModel;
      }

      collectionWriter.write(collectionModel, session);
      await commit();

      this.success(
        `Created collection, model and GraphQL entity for: ${collection.id}`
      );
    }

    await commit();
  }

  private prepareUserModel(genericModel: Models.GenericModel) {
    if (!genericModel.hasField("isEnabled")) {
      genericModel.addField({
        name: "isEnabled",
        type: Models.GenericFieldTypeEnum.BOOLEAN,
      });
    }
    if (!genericModel.hasField("createdAt")) {
      genericModel.addField({
        name: "createdAt",
        type: Models.GenericFieldTypeEnum.DATE,
      });
    }
  }

  protected addReducersToUsers(session: XSession) {
    const fsOperator = new FSOperator(session, {});
    const reducersPath = fsOperator.getTemplatePath(
      path.join("blueprint", "users", "reducers.ts.tpl")
    );

    const targetPath = path.join(
      session.getMicroservicePath(),
      "src",
      "bundles",
      "AppBundle",
      "collections",
      "Users",
      "Users.reducers.ts"
    );

    fsOperator.sessionCopy(reducersPath, targetPath, {
      ignoreIfContains: "fullName",
    });
  }

  private async createFrontendMicroservice(
    model: Studio.App,
    session: XSession,
    commit: () => Promise<void>
  ) {
    FrontendReactMicroserviceModel;
    const frontendMicroservice = new Models.FrontendReactMicroserviceModel();
    frontendMicroservice.name = ADMIN_FOLDER;
    frontendMicroservice.projectName = model.id + "-admin-ui";
    frontendMicroservice.adminMode = true;
    frontendMicroservice.hasCustomGuardian = true;
    frontendMicroservice.type = Models.MicroserviceTypeEnum.FRONTEND_REACT;

    this.writers.microservice.write(frontendMicroservice, session);

    await commit();

    // NPM
    const npmPackages = {
      "@bluelibs/x-ui-admin": "^1.0.0",
      antd: "^4.12.3",
      "@ant-design/icons": "^4.5.0",
    };

    for (const pack in npmPackages) {
      session.installNpmPackage(pack, npmPackages[pack], {
        rootDir: session.getMicroservicePath(),
      });
    }

    await commit();

    this.success(
      `Successfully setup the frontend microservice in "./microservices/${ADMIN_FOLDER}"`
    );
  }

  private async createBackendMicroservice(
    model: Studio.App,
    session: XSession,
    commit: () => Promise<void>
  ) {
    const backendMicroservice = new Models.BackendMicroserviceModel();
    backendMicroservice.hasUsers = true;
    backendMicroservice.hasUploads = true;
    backendMicroservice.createUsersCollection = false;
    backendMicroservice.name = "api";
    backendMicroservice.projectName = model.id;
    backendMicroservice.type = Models.MicroserviceTypeEnum.BACKEND;

    this.writers.microservice.write(backendMicroservice, session);
    const operator = new FSOperator(session, {});

    await commit();

    const bundleDir = FSUtils.bundlePath(
      session.getMicroservicePath(),
      "AppBundle"
    );
    const tpl = operator.getTemplatePathCreator("blueprint");
    operator.sessionCopy(
      tpl("uploads/graphql"),
      path.join(bundleDir, "graphql", "modules", "Uploads"),
      {
        ignoreIfExists: true,
      }
    );

    // NPM
    const npmPackages = {
      "aws-sdk": "^2.948.0",
      "@bluelibs/x-s3-bundle": "^1.0.0",
    };

    for (const pack in npmPackages) {
      session.installNpmPackage(pack, npmPackages[pack], {
        rootDir: session.getMicroservicePath(),
      });
    }

    this.success(
      `Successfully setup the backend microservice in "./microservices/api"`
    );
  }

  public skipping(message) {
    this.options.verbose &&
      console.log(`${chalk.magentaBright("➤")} ${message} (skipping)`);
  }

  public success(message) {
    this.options.verbose && console.log(`${chalk.greenBright("✓")} ${message}`);
  }

  public loading(message) {
    this.options.verbose &&
      console.log(`${chalk.redBright("♦")} ${message}...`);
  }
}
