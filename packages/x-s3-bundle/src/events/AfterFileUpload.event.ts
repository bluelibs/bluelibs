import { Event } from "@bluelibs/core";
import { AppFile } from "../collections/appFiles/AppFile.model";

export class AfterFileUploadEvent extends Event<{
  appFile: AppFile;
}> {}
