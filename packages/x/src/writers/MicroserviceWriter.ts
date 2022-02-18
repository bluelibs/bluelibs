import {
  BlueprintWriter,
  IBlueprintWriterSession,
} from "@bluelibs/terminal-bundle";
import {
  MicroserviceModel,
  MicroserviceTypeEnum,
  CreateBundleModel,
  BackendMicroserviceModel,
  GenericFieldTypeEnum,
  GenericModel,
  CollectionModel,
  FrontendReactMicroserviceModel,
  FrontendNextMicroserviceModel,
} from "../models";
import { FSUtils } from "../utils/FSUtils";
import * as path from "path";
import { FSOperator } from "../utils/FSOperator";
import { writeNewBundle } from "./CreateBundleWriter";
import { NearestElementNotFoundException } from "../exceptions/NearestElementNotFound.exception";
import { XSession } from "../utils/XSession";
import { CollectionWriter } from "./CollectionWriter";

export class MicroserviceWriter extends BlueprintWriter {
  write(
    model:
      | FrontendReactMicroserviceModel
      | FrontendNextMicroserviceModel
      | BackendMicroserviceModel,
    session: XSession
  ) {
    const fsOperator = new FSOperator(session, model);
    const tpl = fsOperator.getTemplatePathCreator("microservice");

    // We can create a microservice that is not part of a project
    let microserviceDir;
    try {
      const projectDir = session.getProjectPath();
      microserviceDir = path.join(projectDir, "microservices", model.name);
      model.projectName = session.getProjectName();
    } catch (e) {
      if (e instanceof NearestElementNotFoundException) {
        microserviceDir = path.join(process.cwd(), model.name);
        model.projectName = model.name;
      } else {
        throw e;
      }
    }

    fsOperator.sessionCopy(tpl(model.type), microserviceDir, {
      ignoreIfExists: true,
    });

    // If it's a backend we also create a backend module
    if (model.type === MicroserviceTypeEnum.BACKEND) {
      FSUtils.setMicroservicePathOverride(microserviceDir);
      const backendModel = model as BackendMicroserviceModel;
      const bundleModel = new CreateBundleModel();
      bundleModel.bundleName = "app";
      bundleModel.containsGraphQL = true;
      writeNewBundle(session, bundleModel, microserviceDir);

      if (backendModel.hasUsers && backendModel.createUsersCollection) {
        this.createUsersCollection(session);
        // generate the users in the bundle
      }
      FSUtils.setMicroservicePathOverride(null);
    }

    // TODO: write AppGuardianSmart.ts only if "hasCustomGuardian"
    if (
      [
        MicroserviceTypeEnum.FRONTEND_REACT,
        MicroserviceTypeEnum.FRONTEND_NEXT,
      ].includes(model.type)
    ) {
      const frontendModel = model as
        | FrontendReactMicroserviceModel
        | FrontendNextMicroserviceModel;

      if (frontendModel.hasCustomGuardian) {
      }
    }

    session.afterCommitInstruction(() => {
      console.log(`Your ${model.type} microservice is now ready`);
      if (model.type === MicroserviceTypeEnum.BACKEND) {
        return console.log(
          `cd ${model.name} ; npm install ; npm update ; npm run start:dev`
        );
      }
      if (model.type === MicroserviceTypeEnum.FRONTEND_REACT) {
        return console.log(
          `cd ${model.name} ; npm install ; npm update ; npm run start:dev`
        );
      }

      if (model.type === MicroserviceTypeEnum.FRONTEND_NEXT) {
        return console.log(
          `cd ${model.name} ; npm install; npm update; npm run dev`
        );
      }
    });
  }

  /**
   * We create the users collection as well
   * @param session
   */
  private createUsersCollection(session: XSession) {
    const collectionWriter = this.getWriter(CollectionWriter);
    const collectionModel = new CollectionModel();
    const genericModel = new GenericModel();
    genericModel.ensureIdField();
    genericModel.name = "User";

    collectionModel.customCollectionImport = "@bluelibs/security-mongo-bundle";
    collectionModel.customCollectionName = "UsersCollection";
    this.prepareUserModel(genericModel);

    collectionModel.modelDefinition = genericModel;
    collectionModel.hasSubscriptions = true;
    collectionModel.isTimestampable = true;
    collectionModel.createEntity = true;
    collectionModel.isSoftdeletable = true;
    collectionModel.validateAgainstModel = false;
    collectionModel.isEntitySameAsModel = true;
    collectionModel.entityDefinition = genericModel;
    collectionModel.collectionName = "users";
    collectionModel.bundleName = "AppBundle";

    collectionWriter.write(collectionModel, session);
  }

  private prepareUserModel(genericModel: GenericModel) {
    genericModel.yupValidation = false;
    genericModel.addField({
      name: "profile",
      type: GenericFieldTypeEnum.MODEL,
      model: {
        name: "UserProfile",
        storage: "embed",
        fields: [
          {
            name: "firstName",
            type: GenericFieldTypeEnum.STRING,
          },
          {
            name: "lastName",
            type: GenericFieldTypeEnum.STRING,
          },
        ],
      },
    });
    genericModel.addField({
      name: "password",
      type: GenericFieldTypeEnum.MODEL,
      ignoreGraphQL: true,
      model: {
        name: "IPasswordAuthenticationStrategy",
        storage: "outside",
        local: false,
        absoluteImport: "@bluelibs/password-bundle",
      },
    });
    if (!genericModel.hasField("isEnabled")) {
      genericModel.addField({
        name: "isEnabled",
        type: GenericFieldTypeEnum.BOOLEAN,
      });
    }
    if (!genericModel.hasField("createdAt")) {
      genericModel.addField({
        name: "createdAt",
        type: GenericFieldTypeEnum.DATE,
      });
    }
  }
}
