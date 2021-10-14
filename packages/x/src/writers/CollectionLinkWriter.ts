import {
  BlueprintWriter,
  IBlueprintWriterSession,
} from "@bluelibs/terminal-bundle";
import { FSUtils } from "../utils/FSUtils";
import * as path from "path";
import { FSOperator } from "../utils/FSOperator";
import { CollectionLinkModel } from "../models/CollectionLinkModel";
import { XSession } from "../utils/XSession";
import * as fs from "fs";

export class CollectionLinkWriter extends BlueprintWriter {
  write(model: CollectionLinkModel, session: XSession) {
    const microserviceDir = session.getMicroservicePath();
    const fsOperator = new FSOperator(session, model);
    const collectionTpls = FSUtils.getTemplatePathCreator("collection");

    const aLinksPath = path.join(
      path.dirname(model.collectionAElement.absolutePath),
      model.collectionAElement.identityNameRaw + ".links.ts"
    );

    const blinksPath = path.join(
      path.dirname(model.collectionBElement.absolutePath),
      model.collectionBElement.identityNameRaw + ".links.ts"
    );

    /**
     * There are situations when we don't want to specify the inversed link, simply because you may not need it.
     * When the link is stored in collection "A", then for sure we have to add the link there
     * So the logic is we process collection "A" inversed if the link from collection "B" is specified
     */
    const shouldProcessA = Boolean(model.linkFromA);
    const shouldProcessB = Boolean(model.linkFromB);

    if (shouldProcessA) {
      if (!this.alreadyExportsLink(aLinksPath, model.linkFromA)) {
        fsOperator.sessionAppendFile(
          aLinksPath,
          fsOperator.getContents(
            collectionTpls("links/collectionA.links.ts.tpl")
          )
        );

        fsOperator.sessionPrependFile(aLinksPath, model.importCollectionBLine);
      } else {
        session.afterCommitInstruction(
          `This file (${aLinksPath}) already exports the link with name ${model.linkFromA}.`
        );
      }
    }

    if (shouldProcessB) {
      if (this.alreadyExportsLink(blinksPath, model.linkFromB)) {
        fsOperator.sessionAppendFile(
          blinksPath,
          fsOperator.getContents(
            collectionTpls("links/collectionB.links.ts.tpl")
          )
        );

        fsOperator.sessionPrependFile(blinksPath, model.importCollectionALine);
      } else {
        session.afterCommitInstruction(
          `This file (${blinksPath}) already exports the link with name ${model.linkFromB}.`
        );
      }
    }

    session.afterCommitInstruction(() => {
      console.log(
        `\nPlease ensure that your database model files and GraphQL types are updated accordingly.\n`
      );
    });
  }

  alreadyExportsLink(filePath, name): boolean {
    const fileContent = fs.readFileSync(filePath).toString();
    const exportLineIndex = fileContent.indexOf(`export const ${name}`);

    if (exportLineIndex === -1) {
      return false;
    }

    // If by any chance we have the link commented out, we take it as if it doesn't exist.
    // Later, we should do this by statically analysing the file.
    const isComment = fileContent.indexOf(`// export const ${name}`) > -1;

    return !isComment;
  }
}
