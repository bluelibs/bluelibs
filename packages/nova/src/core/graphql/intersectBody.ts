import * as _ from "lodash";
import FieldNode from "../query/nodes/FieldNode";
import { ArgumentStore } from "./astToQuery";
import { SPECIAL_PARAM_FIELD } from "../constants";

/**
 * Intersects two query bodies and returns the result
 *
 * @param what
 * @param intersection
 */
export default function intersectBody(what, intersection, andThrow = false) {
  const result = {};
  if (what[ArgumentStore]) {
    result[ArgumentStore] = what[ArgumentStore];
  }
  if (what[SPECIAL_PARAM_FIELD]) {
    result[SPECIAL_PARAM_FIELD] = what[SPECIAL_PARAM_FIELD];
  }

  _.forEach(intersection, (value, fieldName) => {
    if (!what[fieldName]) {
      return;
    }

    const isField = FieldNode.canBodyRepresentAField(value);

    if (isField) {
      result[fieldName] = what[fieldName];
      return;
    }

    const intersection = intersectBody(what[fieldName], value);
    if (!_.isEmpty(intersection)) {
      result[fieldName] = intersection;
    }
  });

  return result;
}
