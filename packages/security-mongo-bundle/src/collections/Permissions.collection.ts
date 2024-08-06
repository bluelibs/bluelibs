import {
  IPermissionPersistance,
  IPermission as BasePermission,
  IPermissionSearchFilters,
  UserId,
  IUser,
} from "@bluelibs/security-bundle";
import { Collection } from "@bluelibs/mongo-bundle";

import * as links from "./Permissions.links";

export interface IPermission extends BasePermission {
  user: IUser;

  createdBy?: IUser;
}

export class PermissionsCollection<T extends IPermission>
  extends Collection<IPermission>
  implements IPermissionPersistance
{
  static collectionName = "permissions";

  static links = links;

  async insertPermission(permission: T): Promise<any> {
    permission = this.getCleanedPermission(permission) as T;

    await this.insertOne(permission);
  }

  async removePermission(filters: IPermissionSearchFilters): Promise<void> {
    await this.deleteMany(this.createMongoFilters(filters));
  }

  async countPermissions(filters: IPermissionSearchFilters): Promise<number> {
    return this.countDocuments(this.createMongoFilters(filters));
  }

  async findPermissions(
    filters: IPermissionSearchFilters
  ): Promise<IPermission[]> {
    return this.find(this.createMongoFilters(filters)).toArray();
  }

  async findPermission(
    filters: IPermissionSearchFilters
  ): Promise<IPermission> {
    return this.findOne(this.createMongoFilters(filters));
  }

  async findDomains(userId: UserId): Promise<string[]> {
    // Do a group by and unique via aggregation?
    return this.collection.distinct("domain", {
      userId: userId,
    });
  }

  /**
   * @param userId
   * @param permission
   */
  protected getCleanedPermission(permission: IPermission): IPermission {
    const permissionToInsert: IPermission = Object.assign({}, permission);
    if (!permissionToInsert.domain) {
      permissionToInsert.domain = null;
    }

    if (!permissionToInsert.domainIdentifier) {
      permissionToInsert.domainIdentifier = null;
    }

    return permissionToInsert;
  }

  /**
   * Returns Mongo Filters For Search
   * @param userId
   * @param search
   */
  protected createMongoFilters(filters: IPermissionSearchFilters) {
    let mongoFilters: any = {};
    const { userId, domain, domainIdentifier, permission, createdById } =
      filters;

    if (userId) {
      Object.assign(mongoFilters, { userId: { $in: userId } });
    }

    if (domain) {
      Object.assign(mongoFilters, { domain: { $in: domain } });
    }

    if (domainIdentifier) {
      Object.assign(mongoFilters, {
        domainIdentifier: { $in: domainIdentifier },
      });
    }

    if (createdById) {
      Object.assign(mongoFilters, {
        createdById: { $in: createdById },
      });
    }

    if (permission) {
      Object.assign(mongoFilters, { permission: { $in: permission } });
    }

    return mongoFilters;
  }
}
