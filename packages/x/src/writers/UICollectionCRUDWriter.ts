import * as path from "path";
import { XSession, FSOperator, FSUtils } from "../";
import { BlueprintWriter } from "@bluelibs/terminal-bundle";
import { CRUDFeatureType, UICRUDModel } from "../models/UICRUDModel";
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
      tpl("ui/crud2/config/i18n.json.tpl"),
      path.join(crudDir, "config", `${model.collectionName}.i18n.json`)
    );

    fsOperator.sessionCopy(
      tpl("ui/crud2/i18n.ts.tpl"),
      path.join(crudDir, "i18n.ts"),
      {
        ignoreIfExists: true,
      }
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
        model.typesToImport[feature] = model.generateApiTypesImports(feature);
        const upperedFeature = _.upperFirst(feature);
        fsOperator.sessionCopy(
          tpl("ui/crud2/components/" + upperedFeature),
          path.join(crudDir, "components", upperedFeature),
          {
            ignoreIfExists: true,
          }
        );

        function copy(configPath, targetPath, ignoreIfExists: boolean = false) {
          fsOperator.sessionCopy(
            tpl("ui/crud2/config/" + configPath),
            path.join(crudDir, "config", targetPath),
            {
              ignoreIfExists,
            }
          );
        }

        if (feature === "create") {
          copy(
            `create.config.base.tsx.tpl`,
            `${model.entityName}CreateForm.base.tsx`
          );
          copy(
            `create.config.tsx.tpl`,
            `${model.entityName}CreateForm.tsx`,
            true
          );
        }
        if (feature === "list") {
          copy(`list.config.base.tsx.tpl`, `${model.entityName}List.base.tsx`);
          copy(`list.config.tsx.tpl`, `${model.entityName}List.tsx`, true);
          copy(
            `listFiltersForm.base.tsx.tpl`,
            `${model.entityName}ListFiltersForm.base.tsx`
          );
          copy(
            `listFiltersForm.tsx.tpl`,
            `${model.entityName}ListFiltersForm.tsx`,
            true
          );
        }
        if (feature === "edit") {
          copy(
            `edit.config.base.tsx.tpl`,
            `${model.entityName}EditForm.base.tsx`
          );
          copy(`edit.config.tsx.tpl`, `${model.entityName}EditForm.tsx`, true);
        }
        if (feature === "view") {
          copy(
            `view.config.base.tsx.tpl`,
            `${model.entityName}Viewer.base.tsx`
          );
          copy(`view.config.tsx.tpl`, `${model.entityName}Viewer.tsx`, true);
        }
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
