/**
 * Taken from: https://github.com/matb33/meteor-collection-hooks/blob/master/collection-hooks.js#L198 and modified.
 * @param mutator
 */
export function getFields(
  mutator
): {
  fields: string[];
  topLevelFields: string[];
} {
  // compute modified fields
  const fields = [];
  const topLevelFields = [];

  for (const op in mutator) {
    const params = mutator[op];
    if (op[0] == "$") {
      Object.keys(params).forEach((field) => {
        // record the field we are trying to change
        if (!fields.includes(field)) {
          const specificPositionFieldMatch = /\.[\d]+(\.)?/.exec(field);
          if (specificPositionFieldMatch) {
            fields.push(field.slice(0, specificPositionFieldMatch.index));
          } else {
            if (field.indexOf(".$") !== -1) {
              if (field.indexOf(".$.") !== -1) {
                fields.push(field.split(".$.")[0]);
              } else {
                fields.push(field.split(".$")[0]);
              }
            } else {
              fields.push(field);
            }
          }

          topLevelFields.push(field.split(".")[0]);
        }
      });
    } else {
      fields.push(op);
    }
  }

  return { fields, topLevelFields };
}
