import { Service } from "@bluelibs/core";
import { intersectBody, QueryBodyType } from "@bluelibs/nova";
import { Constructor, ContainerInstance } from "@bluelibs/core";
import { Collection } from "@bluelibs/mongo-bundle";
import { GraphQLResolverType, IGraphQLContext } from "@bluelibs/graphql-bundle";
import { astToBody } from "../../../nova/src/core/graphql/astToQuery";
import {
  PermissionService,
  SecurityService,
  UserId,
} from "@bluelibs/security-bundle";

export const NOVA_INTERSECTION = Symbol("NOVA_INTERSECTION");

type SecureRuleType = {
  roles: "loggedIn" | string[];
  intersect: any;
};

type SecureMetadata = {
  /**
   * This is the collection class
   */
  collection?: Constructor<Collection>;
  /**
   * This is the path of the document id, can be "_id" or "input._id" depending how you structure it
   */
  documentIdField?: string; // Defaults to "_id"
};

function IdentifyMatchingRule(
  container: ContainerInstance,
  options: SecureRuleType[]
) {
  // Check roles
  // const securityService =
}

export function Secure(
  rules: SecureRuleType[],
  metadata: SecureMetadata = {}
): GraphQLResolverType {
  return async function (_, args, ctx: IGraphQLContext, ast) {
    const xSecurity = ctx.container.get(XSecurityService);
    await xSecurity.secure(rules, metadata, args, ctx, ast);
  };
}

Secure.Intersect = function <T = any>(request: QueryBodyType<T>) {
  // return intersectDeep
};

Secure.IsCurrentUser = function <T>(
  collectionClass: Constructor<Collection<T>>,
  field: keyof T
) {};

@Service()
export class XSecurityService {
  constructor(
    protected readonly securityService: SecurityService,
    protected readonly permissionsService: PermissionService
  ) {}

  async secure(
    rules: SecureRuleType[],
    metadata: SecureMetadata,
    args: any,
    ctx: IGraphQLContext,
    ast: any
  ) {
    const foundRule = await this.identifyMatchingRule(
      rules,
      (ctx as any).userId
    );

    if (!foundRule) {
      // TODO maybe a custom exception?
      throw new Error(
        `Unauthorized. No matching security rule could be found.`
      );
    }

    if (foundRule.intersect) {
      const body = astToBody(ast);
      const resultedIntersection = intersectBody(body, foundRule.intersect);
      ctx[NOVA_INTERSECTION] = resultedIntersection;
    }

    // this.applyRule()
  }

  async intersect<T = any>(request: QueryBodyType<T>) {
    intersectDeep();
  }

  async identifyMatchingRule(
    options: SecureRuleType[],
    userId: UserId
  ): Promise<SecureRuleType> {
    for (const option of options) {
      if (option.roles) {
        if (option.roles === "loggedIn" && Boolean(userId)) {
          return option;
        } else {
          const hasPermission = await this.permissionsService.has({
            userId,
            permission: option.roles,
          });

          if (hasPermission) {
            return option;
          }
        }
      } else {
        return option;
      }
    }
  }
}
