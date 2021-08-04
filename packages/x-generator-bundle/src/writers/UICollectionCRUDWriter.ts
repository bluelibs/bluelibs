import * as path from "path";
import { XSession, FSOperator, FSUtils } from "../";
import { BlueprintWriter } from "@bluelibs/terminal-bundle";
import { CRUDFeatureType, UICRUDModel } from "../models/UICrudModel";
import * as _ from "lodash";

export class UICollectionCRUDWriter extends BlueprintWriter {
  write(model: UICRUDModel, session: XSession) {
    const fsOperator = new FSOperator(session, model);
    const tpl = fsOperator.getTemplatePathCreator("blueprint");
    const microserviceDir = session.getMicroservicePath();
    const pagesDir = FSUtils.bundlePath(
      microserviceDir,
      model.bundleName,
      "pages"
    );
    const crudDir = path.join(
      pagesDir,
      model.studioCollection.id + "Management"
    );

    fsOperator.sessionCopy(
      tpl("ui/crud2/routes.tsx.tpl"),
      path.join(crudDir, "routes.tsx"),
      {
        ignoreIfExists: true,
      }
    );

    fsOperator.sessionCopy(
      tpl("ui/crud2/config/features.ts.tpl"),
      path.join(crudDir, "config", "features.ts")
    );

    fsOperator.sessionCopy(
      tpl("ui/crud2/config/routes.tsx.tpl"),
      path.join(crudDir, "config", "routes.tsx")
    );

    fsOperator.sessionCopy(
      tpl("ui/crud2/styles.scss.tpl"),
      path.join(crudDir, "styles.scss"),
      {
        ignoreIfExists: true,
      }
    );

    const collectionName = model.studioCollection.id;

    ["create", "edit", "view", "list"].forEach((feature: CRUDFeatureType) => {
      if (model.hasFeature(feature)) {
        const upperedFeature = _.upperFirst(feature);
        fsOperator.sessionCopy(
          tpl("ui/crud2/components/" + upperedFeature),
          path.join(crudDir, "components", upperedFeature),
          {
            ignoreIfExists: true,
          }
        );

        const featureConfigId = `${model.collectionName}.${feature}.config.tsx`;

        fsOperator.sessionCopy(
          tpl("ui/crud2/config/" + `${feature}.config.tsx.tpl`),
          path.join(crudDir, "config", featureConfigId)
        );
      }
    });

    fsOperator.sessionAppendFile(
      path.join(pagesDir, "routes.tsx"),
      `export * from "./${collectionName + "Management"}/routes"`
    );

    fsOperator.sessionPrependFile(
      path.join(pagesDir, "styles.scss"),
      `@import "./${collectionName + "Management"}/styles.scss";`
    );
  }
}
