import { IReducerOption } from "@bluelibs/nova";
import { PermissionService, PERMISSION_DEFAULT_DOMAIN } from "@bluelibs/security-bundle";

// Export link names as constants with type of: BundleLinkCollectionOption, sample:
// export const myCustomLink: IReducerOption = { ... }
export const email: IReducerOption = {
  dependency: {
    password: {
      email: 1,
    },
  },
  reduce(user) {
    return user?.password?.email;
  },
};

export const fullName: IReducerOption = {
  dependency: {
    profile: {
      firstName: 1,
      lastName: 1,
    },
  },
  reduce(user) {
    const { profile } = user;
    if (profile) {
      return `${profile.firstName} ${profile.lastName}`;
    } else {
      return "Anonymous";
    }
  },
};

export const roles: IReducerOption = {
  dependency: {
    _id: 1,
    roles: 1,
  },
  async reduce(user, { context }) {
    const roles = user.roles || [];

    const permissionService: PermissionService = context.container.get(
      PermissionService
    );
    // The idea here is that you can have roles stored as an array of strings at user level
    // Or you can have them stored in the permissioning collection
    // Most of the times you don't need complex permissioning logic, so roles at User level suffice
    const permissions = await permissionService.findPermissions({
      domain: PERMISSION_DEFAULT_DOMAIN,
      userId: user._id,
    });

    const result = [...roles, ...permissions.map((permission) => permission.permission)];

    return result;
  },
};
