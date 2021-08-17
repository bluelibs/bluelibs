import { Constructor } from "@bluelibs/core";
import { IGraphQLContext } from "@bluelibs/graphql-bundle";
import { Collection } from "@bluelibs/mongo-bundle";
import * as graphqlFields from "graphql-fields";
import { intersectGraphQLBodies } from "./utils/intersectGraphQLBodies";
import {
  IPermissionSearchFilter,
  PERMISSION_DEFAULT_DOMAIN,
  UserNotAuthorizedException,
  PermissionService,
} from "@bluelibs/security-bundle";
import {
  SecureGraphQLResolver,
  SecureRuleType,
  XGraphQLSecurityService,
} from "../services/XGraphQLSecurityService";
import { IAstToQueryOptions, QueryBodyType } from "@bluelibs/nova";

export const NOVA_AST_TO_QUERY_OPTIONS = Symbol("NOVA_AST_TO_QUERY_OPTIONS");
export const NOVA_INTERSECTION = Symbol("NOVA_INTERSECTION");

export function CheckLoggedIn() {
  return async function (_, args, ctx, ast) {
    if (!ctx.userId) {
      throw new UserNotAuthorizedException();
    }
  };
}

export type PermissionResolver = (
  _,
  args,
  ctx,
  ast
) => Promise<IPermissionSearchFilter>;

/**
 * Check if the current user has a set of permissions or roles.
 * @param permissions
 * @returns
 */
export function CheckPermission(
  permissions: string | string[] | PermissionResolver
) {
  return async function (_, args, ctx, ast) {
    const permissionService: PermissionService =
      ctx.container.get(PermissionService);

    let search: IPermissionSearchFilter;

    if (typeof permissions === "function") {
      search = await permissions(_, args, ctx, ast);
    } else {
      search = {
        permission: permissions,
      };
    }

    if (!search.userId) {
      search.userId = ctx.userId;
      search.domain = PERMISSION_DEFAULT_DOMAIN;
    }

    const hasPermissions = await permissionService.has(search);

    if (!hasPermissions) {
      throw new UserNotAuthorizedException();
    }
  };
}

export function Secure(rules: SecureRuleType[]): SecureGraphQLResolver<void> {
  return async function (_, args, ctx: IGraphQLContext, ast) {
    const xSecurity = ctx.container.get(XGraphQLSecurityService);
    await xSecurity.secure(rules, args, ctx, ast);
  };
}
// run: [
//   X.Secure.Intersect<User>({}),
//   X.Secure.IsUser(CollectionClass, "field", "_id"),
//   X.Secure.ApplyNovaOptions(() => {}),
// ],

/**
 * Use it to intersect the GraphQL request. Will throw when unallowed fields are requested.
 * @param intersectBody
 * @param passToNova If you have a subsequent nova request, this will send the intersection to the Nova request.
 * @returns
 */
Secure.Intersect = function <T = null>(
  intersectBody: QueryBodyType<T>,
  passToNova: boolean = true
): SecureGraphQLResolver<void> {
  // const intersection = intersectGraphQLBodies()
  const dottedIntersection = dot.dot(intersectBody);
  return async function (_, args, ctx, ast) {
    const requestAsJSON = graphqlFields(
      ast,
      {},
      { processArguments: true, excludedFields: ["__typename"] }
    );

    if (passToNova) {
      ctx[NOVA_INTERSECTION] = intersectBody;
    }

    // This function throws
    intersectGraphQLBodies(requestAsJSON, dottedIntersection);
  };
};

/**
 * This function is used to verify whether the field in the database is for the currently logged in user
 * @param collectionClass
 * @param databaseField
 * @param argumentIdField
 * @returns
 */
Secure.IsUser = function (
  collectionClass: Constructor<Collection>,
  databaseField: string,
  argumentIdField: string
): SecureGraphQLResolver<void> {
  return async function (_, args, ctx, ast) {
    const collection: Collection = ctx.container.get(collectionClass);
    const _id = args[argumentIdField];
    const userId = (ctx as any).userId;

    if (!userId) {
      throw new UserNotAuthorizedException();
    }

    const result = await collection.count({
      _id,
      [databaseField]: { $in: [userId] },
    });

    if (result === 0) {
      throw new Error(
        `Security: The ownership of the document could not be verified.`
      );
    }
  };
};

/**
 * These options such as "filters", "options" will be applied on top of the rules of the subsequent Nova. This is used for example when you want to filter the request and enforce filters.
 * Even if you have "Intersect", it is recommended to use the same intersection at Nova level too.
 * @param options
 * @returns
 */
Secure.ApplyNovaOptions = function (
  options: IAstToQueryOptions | SecureGraphQLResolver<IAstToQueryOptions>
): SecureGraphQLResolver<void> {
  return async function (_, args, ctx, ast) {
    let $options =
      typeof options === "function" ? options(_, args, ctx, ast) : options;

    ctx[NOVA_AST_TO_QUERY_OPTIONS] = $options;
  };
};

Secure.Match = {
  /**
   * Use this to match the user to a set of role or roles
   * @param roles
   * @returns
   */
  Roles: function (roles: string | string[]): SecureGraphQLResolver<boolean> {
    return async function (_, args, ctx, ast) {
      const permissionsService = ctx.container.get(PermissionService);
      const userId = (ctx as any).userId;

      return permissionsService.has({
        userId: userId,
        permission: roles,
        domain: PERMISSION_DEFAULT_DOMAIN,
      });
    };
  },
};

/**
 * Use this if you have a set of business logic that dictates whether to run or not. Typically this is used when you have an external file which says which functions you have available.
 * @param value
 * @returns
 */
Secure.RunIf = function (value) {
  return async function (_, args, ctx, ast) {
    if (!value) {
      throw new Error(`Security: this request is not allowed to run.`);
    }
  };
};
