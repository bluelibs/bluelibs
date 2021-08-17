import { IAstToQueryOptions } from "@bluelibs/nova";
import { Constructor, ContainerInstance } from "@bluelibs/core";
import { detectPipelineInSideBody } from "./detectPipelineInSideBody";
import { performRelationalSorting } from "./performRelationalSorting";
import { IGraphQLContext } from "@bluelibs/graphql-bundle";
import { Collection } from "@bluelibs/mongo-bundle";
import * as merge from "lodash.merge";
import { NOVA_AST_TO_QUERY_OPTIONS, NOVA_INTERSECTION } from "../security";

export const prepareForExecution = (
  ctx: IGraphQLContext,
  collectionClass: Constructor<Collection<any>>,
  astToQueryOptions: IAstToQueryOptions
): IAstToQueryOptions => {
  if (ctx[NOVA_INTERSECTION] && !astToQueryOptions.intersect) {
    astToQueryOptions.intersect = ctx[NOVA_INTERSECTION];
  }

  // This is stored from XGraphQLSecurityService
  if (ctx[NOVA_AST_TO_QUERY_OPTIONS]) {
    astToQueryOptions = merge(
      {},
      astToQueryOptions,
      ctx[NOVA_AST_TO_QUERY_OPTIONS]
    );
  }

  const container = ctx.container;

  let { sideBody, ...cleanedOptions } = astToQueryOptions.options || {};
  if (!sideBody) {
    sideBody = {};
    astToQueryOptions.sideBody = sideBody;
  } else {
    // This ensures we don't have any pipeline
    detectPipelineInSideBody(sideBody);
  }

  if (!sideBody.$) {
    sideBody.$ = {};
  }

  // The sort from options takes owning
  const sort = cleanedOptions?.sort || sideBody.$.options?.sort;

  if (sort && Object.keys(sort).length > 0) {
    const pipeline = performRelationalSorting(container, collectionClass, sort);
    if (pipeline.length) {
      if (sideBody.$.pipeline) {
        sideBody.$.pipeline.push(...pipeline);
      } else {
        sideBody.$.pipeline = pipeline;
      }
    }
  }

  return astToQueryOptions;
};
