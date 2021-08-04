import {
  IPermissionPersistance,
  IPermission,
  IPermissionSearchFilters,
} from "../../../defs";

export class PermissionsPersistanceService implements IPermissionPersistance {
  db: Array<IPermission>;

  constructor() {
    this.db = [];
  }

  async insertPermission(permission: IPermission) {
    this.db.push({
      ...permission,
    });
  }

  async removePermission(filters: IPermissionSearchFilters) {
    this.db = this.db.filter((p) => {
      return !this.isMatch(p, filters);
    });
  }

  async countPermissions(filters: IPermissionSearchFilters) {
    return (await this.findPermissions(filters)).length;
  }

  async findPermissions(
    search: IPermissionSearchFilters
  ): Promise<IPermission[]> {
    return this.db.filter((p) => this.isMatch(p, search));
  }

  async findPermission(
    search: IPermissionSearchFilters
  ): Promise<null | IPermission> {
    return this.db.find((p) => this.isMatch(p, search));
  }

  async findDomains(userId): Promise<string[]> {
    const unique = (value, index, self) => {
      return self.indexOf(value) === index;
    };

    return this.db
      .filter((p) => p.userId === userId)
      .map((p) => p.domain)
      .filter(unique);
  }

  private isMatch(
    permission: IPermission,
    search: IPermissionSearchFilters
  ): boolean {
    let includesPermission = true;
    if (search.permission && search.permission.length) {
      includesPermission = search.permission.includes(permission.permission);
    }

    let domainCheck = true;
    if (search.domain && search.domain.length) {
      domainCheck = search.domain.includes(permission.domain);
    }

    let domainIdentifierCheck = true;
    if (search.domainIdentifier && search.domainIdentifier.length) {
      domainIdentifierCheck = search.domainIdentifier.includes(
        permission.domainIdentifier
      );
    }

    let includesUser = true;

    if (search.userId) {
      includesUser = Boolean(search.userId.includes(permission.userId));
    }

    return (
      includesUser && includesPermission && domainCheck && domainIdentifierCheck
    );
  }
}
