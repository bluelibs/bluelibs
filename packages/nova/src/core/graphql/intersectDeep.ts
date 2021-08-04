import * as _ from "lodash";
import FieldNode from "../query/nodes/FieldNode";
import { ArgumentStore } from "./astToQuery";
import { SPECIAL_PARAM_FIELD, SCHEMA_FIELD } from "../constants";

/**
 * Intersects two query bodies and returns the result
 *
 * @param what
 * @param intersection
 */
export default function intersectDeep(what, intersection) {
  const result = {};
  if (what[ArgumentStore]) {
    result[ArgumentStore] = what[ArgumentStore];
  }
  if (what[SPECIAL_PARAM_FIELD]) {
    result[SPECIAL_PARAM_FIELD] = what[SPECIAL_PARAM_FIELD];
  }
  if (what[SCHEMA_FIELD]) {
    result[SCHEMA_FIELD] = what[SCHEMA_FIELD];
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

    const intersection = intersectDeep(what[fieldName], value);
    if (!_.isEmpty(intersection)) {
      result[fieldName] = intersection;
    }
  });

  return result;
}
