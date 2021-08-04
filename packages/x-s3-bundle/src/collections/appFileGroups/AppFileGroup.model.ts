import { ObjectID } from "@bluelibs/mongo-bundle";
import { AppFile } from "../appFiles/AppFile.model";

export class AppFileGroup {
  _id: ObjectID;
  name?: string;
  /**
   * Where does this file come from? What purpose it servers. It's a good idea to have a context for each file group.
   */
  context?: string;
  files: AppFile[];
  filesIds: ObjectID[];
}
