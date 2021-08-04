/**
 * @param fieldsObject {Object} {"profile.firstName": 1, "roles": 1, "something": 1 }
 * @param fieldsArray {Array} ["profile", "roles.xx", "something" ]
 */
export function hasSortFields(fieldsObject, fieldsArray) {
  const existingFields = Object.keys(fieldsObject);

  for (let i = 0; i < fieldsArray.length; i++) {
    const field = fieldsArray[i];
    for (let j = 0; j < existingFields.length; j++) {
      const existingField = existingFields[j];

      if (
        existingField == field ||
        field.indexOf(existingField + ".") != -1 ||
        existingField.indexOf(field + ".") != -1
      ) {
        return true;
      }
    }
  }

  return false;
}
