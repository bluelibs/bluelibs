export default function applyProps(node) {
  const filters = Object.assign({}, node.props.filters);
  const options = Object.assign({}, node.props.options);

  options.projection = options.projection || {};

  node.applyFields(filters, options);

  return { filters, options };
}
