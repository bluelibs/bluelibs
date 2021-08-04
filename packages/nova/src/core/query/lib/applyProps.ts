import _ from "lodash";

export default function applyProps(node) {
  let filters = Object.assign({}, node.props.filters);
  let options = Object.assign({}, node.props.options);

  options.projection = options.projection || {};

  node.applyFields(filters, options);

  return { filters, options };
}
