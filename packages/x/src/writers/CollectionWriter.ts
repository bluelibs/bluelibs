import {
  BlueprintWriter,
  IBlueprintWriterSession,
} from "@bluelibs/terminal-bundle";
import { MicroserviceModel, CreateBundleModel, GenericModel } from "../models";
import { FSUtils } from "../utils/FSUtils";
import * as path from "path";
import { FSOperator } from "../utils/FSOperator";
import { CollectionModel } from "../models/CollectionModel";
import { GraphQLEntityWriter } from "./GraphQLEntityWriter";
import { GraphQLInputModel } from "../models/GraphQLInputModel";
import { ModelRaceEnum } from "../models/defs";
import { GenericModelWriter } from "./GenericModelWriter";
import { XSession } from "../utils/XSession";

export class CollectionWriter extends BlueprintWriter {
  write(model: CollectionModel, session: XSession) {
    const fsOperator = new FSOperator(session, model);

    const collectionTpls = fsOperator.getTemplatePathCreator("collection");
    const modelTpls = fsOperator.getTemplatePathCreator("model");
    const microserviceDir = session.getMicroservicePath();
    const collectionsDir = FSUtils.bundlePath(
      microserviceDir,
      model.bundleName,
      "collections"
    );

    const collectionDir = path.join(collectionsDir, model.collectionNameUpper);
    const copyTemp = (subpath, options?) => {
      fsOperator.sessionCopy(
        collectionTpls(
          path.join("create", `___collectionNameUpper___.${subpath}.ts.tpl`)
        ),
        path.join(collectionDir, model.collectionNameUpper + `.${subpath}.ts`),
        options
      );
    };

    copyTemp("collection", {
      // if overrideCollectionIfExists === true, we don't ignore it, we override it
      ignoreIfExists: !model.overrideCollectionIfExists,
    });
    copyTemp("links", {});
    copyTemp("reducers", {
      ignoreIfExists: true,
    });

    const currentCollectionDir = path.join(
      collectionsDir,
      model.collectionNameUpper
    );

    model.modelDefinition.yupValidation = true;
    model.modelDefinition.targetPath = path.join(
      currentCollectionDir,
      `${model.modelDefinition.name}.model.ts`
    );

    this.getWriter(GenericModelWriter).write(model.modelDefinition, session);

    if (model.createEntity) {
      this.getWriter(GraphQLEntityWriter).write(
        {
          bundleName: model.bundleName,
          genericModel: GenericModel.clone(model.entityDefinition),
        },
        session
      );
    }

    fsOperator.sessionAppendFile(
      path.join(collectionsDir, "index.ts"),
      `export * from "./{{ collectionNameUpper }}"`
    );

    fsOperator.sessionAppendFile(
      path.join(collectionDir, "index.ts"),
      `export * from "./{{ collectionNameUpper }}.collection"`
    );
    fsOperator.sessionAppendFile(
      path.join(collectionDir, "index.ts"),
      `export * from "./{{ collectionModelClass }}.model"`
    );
  }
}
