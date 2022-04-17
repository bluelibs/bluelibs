import { ObjectID } from "@bluelibs/mongo-bundle";
import { IUser } from "@bluelibs/security-bundle";
import { AppFileGroup } from "../appFileGroups/AppFileGroup.model";

export class AppFile {
  _id: ObjectID;
  name: string;
  path: string;
  size: number;
  mimeType: string;

  store?: string;

  metadata: object;
  thumbs: AppFileThumb[] = [];

  /**
   * Where does this file come from? What purpose this file serves. It's a good idea to have a context for each file group.
   */
  context?: string;

  /**
   * To have a generic way of linking data
   */
  resourceId?: ObjectID;
  resourceType?: string;

  uploadedBy?: IUser;
  uploadedById?: ObjectID;

  /**
   * This is a reducer that is retrieved through Nova, but at the same time we also have GraphQL resolvers for it.
   * @reducer
   */
  downloadUrl: string;

  groups?: AppFileGroup[];
  createdAt: Date;
  updatedAt: Date;
}

export class AppFileThumb {
  id: string;
  path: string;
}
