import { Service } from "@bluelibs/core";
import { IGraphQLContext } from "@bluelibs/graphql-bundle";
import { PermissionService, SecurityService } from "@bluelibs/security-bundle";

export type SecureGraphQLResolver<T> = (
  _,
  args,
  ctx: IGraphQLContext,
  ast
) => T | Promise<T>;

export type SecureRuleType = {
  /**
   * What rule do we apply to see which set of rules to run? The match can be left empty, usually to say something like: "for all users including anonymous"
   */
  match?: SecureGraphQLResolver<boolean>;
  /**
   * Run additional security validations if the match exists
   */
  run?: SecureGraphQLResolver<any>[];
};

@Service()
export class XGraphQLSecurityService {
  constructor(
    protected readonly securityService: SecurityService,
    protected readonly permissionsService: PermissionService
  ) {}

  async secure(
    rules: SecureRuleType | SecureRuleType[],
    args: any,
    ctx: IGraphQLContext,
    ast: any
  ) {
    if (!Array.isArray(rules)) {
      return this.secure(rules, args, ctx, ast);
    }

    // Let's find the first matching rule
    let foundRule: SecureRuleType;
    for (const rule of rules) {
      if (rule.match) {
        const result = await rule.match(null, args, ctx, ast);
        if (result) {
          foundRule = rule;
          break;
        }
      } else {
        foundRule = rule;
        break;
      }
    }

    if (!foundRule) {
      throw new Error(
        `Unauthorized. No matching security rule could be found.`
      );
    }

    let result;

    // Run the subsequent functions
    if (foundRule.run) {
      for (const runFn of foundRule.run) {
        result = await runFn(null, args, ctx, ast);
      }
    }

    return result;
  }
}
