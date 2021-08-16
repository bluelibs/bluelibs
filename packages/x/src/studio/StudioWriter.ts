import {
  BlueprintWriter,
  IBlueprintWriterSession,
} from "@bluelibs/terminal-bundle";
import { FSOperator, XElements, XSession, XElementType, FSUtils } from "..";
import * as Studio from ".";
import { Models, Writers } from "..";
import * as fs from "fs";
import * as path from "path";
import { EJSON } from "@bluelibs/ejson";
import { UICollectionWriter } from "../writers/UICollectionWriter";
import { UICollectionModel } from "../models/UICollectionModel";
import { UICRUDModel } from "../models/UICRUDModel";
import { UICollectionCRUDWriter } from "../writers/UICollectionCRUDWriter";
import { XBridge } from "./bridge/XBridge";
import { Fixturizer } from "./bridge/Fixturizer";
import { XElementClassSuffix } from "../utils/XElements";
import { CollectionReducerWriter } from "../writers/CollectionReducerWriter";
import { CollectionReducerModel } from "../models/CollectionReducerModel";
import {
  ALL_GENERATORS,
  GenerateProjectOptionsType,
  GeneratorKind,
  StudioWritersType,
} from "./defs";
import { ContainerInstance } from "@bluelibs/core";
import { ModelRaceEnum } from "../models";

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

    const projectPath = process.cwd();
    session.setProjectPath(projectPath);

    // BACKEND
    const backendMicroservicePath = path.join(
      projectPath,
      "microservices",
      API_FOLDER
    );

    session.setMicroservicePath(backendMicroservicePath);
    if (!fs.existsSync(backendMicroservicePath)) {
      await this.createBackendMicroservice(studioApp, session, commit);
    } else {
      console.log(`➤ Backend microservice already exists. Skipping.`);
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
    if (!fs.existsSync(frontendMicroservicePath)) {
      await this.createFrontendMicroservice(studioApp, session, commit);
    } else {
      console.log(`➤ Frontend microservice already exists. Skipping.`);
    }

    session.setMicroservicePath(frontendMicroservicePath);

    if (this.hasGenerator(GeneratorKind.FRONTEND_COLLECTIONS)) {
      await this.createUICollections(studioApp, session, commit);
    }
    if (this.hasGenerator(GeneratorKind.FRONTEND_CRUDS)) {
      await this.createUICRUDs(studioApp, session, commit);
    }
    if (this.hasGenerator(GeneratorKind.FRONTEND_BOILERPLATE_COMPONENTS)) {
      await this.createBoilerplateUIComponents(studioApp, session, commit);
    }
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
    operator.sessionCopy(
      tpl("ui/components/Home.tsx"),
      path.join(pagesDir, "Home", "Home.tsx"),
      {
        ignoreIfContains: "This is your application",
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
      `
      export * from "./Dashboard/routes";
      export * from "./Authentication/routes";
      `
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

    studioApp.collections.forEach((collection) => {
      if (collection.ui === false) {
        return;
      }
      if (collection.isExternal()) {
        return;
      }

      const model = new UICRUDModel();
      model.bundleName = "UIAppBundle";
      model.studioCollection = collection;

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

    studioApp.collections.forEach((collection) => {
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
      if (!collection.enableGraphQL) {
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
      model.insertInputModelDefinition = XBridge.collectionToGenericModel(
        collection,
        {
          graphql: true,
          // skipRelations: true,
          ui: "create",
          isInput: true,
        }
      );
      model.updateInputModelDefinition = XBridge.collectionToGenericModel(
        collection,
        {
          graphql: true,
          // skipRelations: true,
          ui: "edit",
          isInput: true,
        }
      );

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

    for (const collection of studioApp.collections) {
      collection.relations.forEach((_relation) => {
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

        linkWriter.write(model, session);

        this.success(
          `Linked collection: "${collection.id}:${relation.id}" to -> "${relation.to.id}"`
        );
      });
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

    for (const collection of studioApp.collections) {
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
    for (const model of studioApp.sharedModels) {
      const genericModel = new Models.GenericModel(model.id);

      genericModel.name = model.id;
      genericModel.yupValidation = true;

      model.fields.forEach((field) => {
        genericModel.addField(XBridge.fieldToGenericField(field));
      });

      const bundleDir = FSUtils.bundlePath(
        session.getMicroservicePath(),
        "AppBundle"
      );

      const sharedModelsPath = path.join(
        bundleDir,
        ...pathsInfo.sharedModelPathInBundle.split("/")
      );

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
        const graphqlTypeModel = new Models.GraphQLInputModel();
        graphqlTypeModel.bundleName = "AppBundle";
        graphqlTypeModel.genericModel = Models.GenericModel.clone(genericModel);
        graphqlTypeModel.genericModel.race = ModelRaceEnum.GRAPHQL_TYPE;

        graphqlEntityWriter.write(graphqlTypeModel, session);

        const graphqlInputModel = new Models.GraphQLInputModel();
        graphqlInputModel.bundleName = "AppBundle";
        graphqlInputModel.genericModel =
          Models.GenericModel.clone(genericModel);
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
    for (const collection of studioApp.collections) {
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
      collectionModel.isEntitySameAsModel = false;
      collectionModel.collectionName = collection.id;
      collectionModel.bundleName = "AppBundle";
      collectionModel.createEntity = false;

      if (collection.enableGraphQL) {
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
    const frontendMicroservice = new Models.FrontendMicroserviceModel();
    frontendMicroservice.name = ADMIN_FOLDER;
    frontendMicroservice.projectName = model.id + "-admin-ui";
    frontendMicroservice.adminMode = true;
    frontendMicroservice.hasCustomGuardian = true;
    frontendMicroservice.type = Models.MicroserviceTypeEnum.FRONTEND;

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
      "graphql-upload": "^12.0.0",
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

  protected success(message) {
    console.log(`✅ ${message}`);
  }
}
