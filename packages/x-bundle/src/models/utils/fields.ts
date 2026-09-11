import { QueryBodyType } from "@bluelibs/nova";

export function getFieldsFromQueryBody<T>(body: QueryBodyType<T>) {
  return Object.keys(body).filter((key) => {
    return !["$", "$alias"].includes(key);
  });
}

export function getAllowedFields(
  currentAllowedFields: string[] | null,
  modifiedFields: string[]
) {
  if (currentAllowedFields === null) {
    return modifiedFields;
  }

  return modifiedFields.filter((modifiedField) => {
    return currentAllowedFields.includes(modifiedField);
  });
}
