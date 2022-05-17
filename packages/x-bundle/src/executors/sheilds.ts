import { USER_ROLES_TOKEN } from "@bluelibs/security-mongo-bundle";
import { Studio } from "@bluelibs/x";
import { CheckLoggedIn, CheckPermission, Secure } from "./security";
//container.getRoles()
type GetInnerType<S> = S extends Studio.SecuritySchematic<infer T> ? T : never;

export const SheildsFind = (
  resolvers: ((_: any, args: any, ctx: any, ast: any) => Promise<any>)[],
  collection: any,
  config?: Studio.SecuritySchematic
) => {
  if (!config) config = collection.securityConfig;
  if (!config) throw "please provide a security sheidl config";
  return async function (_, args, ctx, ast) {
    const UserRoles: string[] = ctx.container.get(USER_ROLES_TOKEN);
    type ModelType = GetInnerType<typeof config>;
    let { findRolesRules, securitySheilds } = allowDenyByRolesSheild(
      config,
      "find",
      UserRoles
    );
    securitySheilds = filtersSheild(
      collection,
      securitySheilds,
      findRolesRules
    );
    resolvers = [...securitySheilds, ...resolvers];
    let result;
    for (const action of resolvers) {
      result = await action(_, args, ctx, ast);
    }

    return result;
  };
};

export const SheildsInsert = (
  resolvers: ((_: any, args: any, ctx: any, ast: any) => Promise<any>)[],
  collection: any,
  config?: Studio.SecuritySchematic,
  options?: any
) => {
  if (!config) config = collection.securityConfig;
  if (!config) throw "please provide a security sheidl config";
  options = {
    throwWhenSurpassFields: false,
    documentField: "document",
    ...options,
  };
  const { throwWhenSurpassFields, documentField } = options;
  return async function (_, args, ctx, ast) {
    const UserRoles: string[] = ctx.container.get(USER_ROLES_TOKEN);

    type ModelType = GetInnerType<typeof config>;
    let { findRolesRules, securitySheilds } = allowDenyByRolesSheild(
      config,
      "insertOne",
      UserRoles
    );

    securitySheilds = filtersSheild<ModelType>(
      collection,
      securitySheilds,
      findRolesRules
    );
    args = inputsSheild(
      args,
      findRolesRules,
      UserRoles,
      documentField,
      throwWhenSurpassFields
    );
    resolvers = [...securitySheilds, ...resolvers];
    let result;
    for (const action of resolvers) {
      result = await action(_, args, ctx, ast);
    }

    return result;
  };
};

export const SheildsUpdate = (
  resolvers: ((_: any, args: any, ctx: any, ast: any) => Promise<any>)[],
  collection: any,
  config?: Studio.SecuritySchematic,
  options?: any
) => {
  if (!config) config = collection.securityConfig;
  if (!config) throw "please provide a security sheidl config";
  options = {
    throwWhenSurpassFields: false,
    documentField: "document",
    ...options,
  };
  const { throwWhenSurpassFields, documentField } = options;
  return async function (_, args, ctx, ast) {
    const UserRoles: string[] = ctx.container.get(USER_ROLES_TOKEN);
    type ModelType = GetInnerType<typeof config>;
    let { findRolesRules, securitySheilds } = allowDenyByRolesSheild(
      config,
      "updateOne",
      UserRoles
    );

    securitySheilds = filtersSheild<ModelType>(
      collection,
      securitySheilds,
      findRolesRules
    );
    args = inputsSheild(
      args,
      findRolesRules,
      UserRoles,
      documentField,
      throwWhenSurpassFields
    );
    resolvers = [...securitySheilds, ...resolvers];
    let result;
    for (const action of resolvers) {
      result = await action(_, args, ctx, ast);
    }

    return result;
  };
};

export const SheildsDelete = (
  resolvers: ((_: any, args: any, ctx: any, ast: any) => Promise<any>)[],
  collection: any,
  config?: Studio.SecuritySchematic
) => {
  if (!config) config = collection.securityConfig;
  if (!config) throw "please provide a security sheidl config";
  return async function (_, args, ctx, ast) {
    const UserRoles: string[] = ctx.container.get(USER_ROLES_TOKEN);
    type ModelType = GetInnerType<typeof config>;
    let { findRolesRules, securitySheilds } = allowDenyByRolesSheild(
      config,
      "deleteOne",
      UserRoles
    );

    securitySheilds = filtersSheild<ModelType>(
      collection,
      securitySheilds,
      findRolesRules
    );
    resolvers = [...securitySheilds, ...resolvers];
    let result;
    for (const action of resolvers) {
      result = await action(_, args, ctx, ast);
    }

    return result;
  };
};

function booleanRoleToObject(role): Studio.SecuritySchematicRole<any> {
  if (typeof role === "boolean")
    return {
      find: role,
      insertOne: role,
      updateOne: role,
      deleteOne: role,
    };
  return role;
}

function allowDenyByRolesSheild(
  config: Studio.SecuritySchematic,
  crudOperationKey: string,
  onlyRoles: string[]
) {
  const securitySheilds = [];
  //anonymous
  (config.anonymous as Studio.SecuritySchematicRole) = booleanRoleToObject(
    config.anonymous
  );
  (config.defaults as Studio.SecuritySchematicRole) = booleanRoleToObject(
    config.defaults
  );
  Object.keys(config.roles).forEach(
    (role) =>
      ((config.roles[role] as Studio.SecuritySchematicRole) =
        booleanRoleToObject(config.roles[role]))
  );

  if (!(config.anonymous as Studio.SecuritySchematicRole)?.[crudOperationKey]) {
    securitySheilds.push(CheckLoggedIn());
  }
  const findRolesRules: any = {};
  //preapare the roles
  if ((config.anonymous as Studio.SecuritySchematicRole)?.[crudOperationKey]) {
    //change with anonymous value from secdurity service
    onlyRoles.push("anonymous");
  }
  onlyRoles.forEach((role) => {
    findRolesRules[role] =
      (config?.roles[role] as Studio.SecuritySchematicRole)?.[
        crudOperationKey
      ] === undefined
        ? (config.defaults as Studio.SecuritySchematicRole)?.[crudOperationKey]
        : (config.roles[role] as Studio.SecuritySchematicRole)[
            crudOperationKey
          ];
  });
  findRolesRules.anonymous =
    (config?.anonymous as Studio.SecuritySchematicRole)?.[crudOperationKey] ===
    undefined
      ? (config.defaults as Studio.SecuritySchematicRole)?.[crudOperationKey]
      : (config.anonymous as Studio.SecuritySchematicRole)?.[crudOperationKey];
  if (!(config.anonymous as Studio.SecuritySchematicRole)?.[crudOperationKey])
    securitySheilds.push(
      CheckPermission(
        Object.keys(findRolesRules).filter((role) => findRolesRules[role])
      )
    );
  return { findRolesRules, securitySheilds };
}

function filtersSheild<ModelType>(collection, securitySheilds, findRolesRules) {
  securitySheilds.push(
    Secure(
      Object.keys(findRolesRules)
        .filter((role) => findRolesRules[role])
        .map((role) => {
          const runBody = [];

          if (findRolesRules[role] !== true) {
            //make own an array and do $or in filters
            if (findRolesRules[role].own && collection)
              runBody.push(
                Secure.IsUser(
                  collection,
                  Array.isArray(findRolesRules[role].own)
                    ? findRolesRules[role].own[0]
                    : findRolesRules[role].own,
                  Array.isArray(findRolesRules[role].own)
                    ? findRolesRules[role].own[1]
                    : "_id"
                )
              );
            if (findRolesRules[role].intersect) {
              runBody.push(
                Secure.Intersect<ModelType>(findRolesRules[role].intersect)
              );
            }

            const novaOptions: any = {};
            if (findRolesRules[role].filters)
              novaOptions.filters = findRolesRules[role].filters;

            if (findRolesRules[role].maxLimit)
              novaOptions.maxLimit = findRolesRules[role].maxLimit;
            if (findRolesRules[role].maxDepth)
              novaOptions.maxDepth = findRolesRules[role].maxDepth;
            if (findRolesRules[role].options)
              novaOptions.options = findRolesRules[role].options;
            if (Object.keys(novaOptions).length) {
              runBody.push(Secure.ApplyNovaOptions(novaOptions));
            }
          }

          return {
            match: role === "anonymous" ? undefined : Secure.Match.Roles(role),
            run: runBody,
          };
        })
    )
  );
  return securitySheilds;
}

function inputsSheild(
  args,
  findRolesRules,
  documentField,
  throwWhenSurpassFields,
  onlyRoles: string[]
) {
  onlyRoles.forEach((role) => {
    findRolesRules[role];
    if (findRolesRules[role].allow) {
      //comeback to allow path options as field.field.field
      const newDoc = Object.keys(args[documentField]).reduce((prev, key) => {
        if (findRolesRules[role].allow.some((x) => x === key))
          prev[key] = args[documentField][key];
        else if (throwWhenSurpassFields) {
          throw `field ${key} not allowed`;
        }
        return prev;
      }, {});
      args[documentField] = newDoc;
    }
    if (findRolesRules[role].deny) {
      const newDoc = args[documentField];
      //comeback to allow path options as field.field.field
      findRolesRules[role].deny.map((key) => {
        if (newDoc[key] !== undefined && throwWhenSurpassFields) {
          throw `field ${key} not allowed`;
        }
        delete newDoc[key];
      });
      args[documentField] = newDoc;
    }
  });
  return args;
}
