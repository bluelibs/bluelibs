import * as _ from "lodash";
import FieldNode from "./FieldNode";
import { SPECIAL_FIELDS } from "../../constants";

/**
 * This class was used to do field projection on the result set
 * This might be useful in the future for other use-cases
 * @deprecated
 */
export default class ProjectionNode {
  public name: string;
  public body: any;
  public nodes: ProjectionNode[] = [];
  public isLeaf: boolean = false;

  constructor(name, body) {
    this.name = name;
    this.body = body;

    if (_.isObject(body)) {
      if (!FieldNode.canBodyRepresentAField(body)) {
        _.forEach(body, (value, fieldName) => {
          // We do not perform projection for fields such as $ or $alias
          if (!SPECIAL_FIELDS.includes(fieldName)) {
            this.nodes.push(new ProjectionNode(fieldName, value));
          }
        });
      }
    }

    this.isLeaf = this.nodes.length === 0;
  }

  public project(object) {
    if (!object) {
      return null;
    }

    if (_.isArray(object)) {
      return object.map((subobject) => this.project(subobject));
    }

    const newObject = {};
    this.nodes.forEach((node) => {
      newObject[node.name] = node.isLeaf
        ? object[node.name]
        : node.project(object[node.name]);
    });

    return newObject;
  }
}
