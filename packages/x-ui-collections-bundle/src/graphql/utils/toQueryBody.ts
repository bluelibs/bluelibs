export const isObjectPrototype = (value) =>
  Object.getPrototypeOf(value) === Object.prototype;

export const toQueryBody = (dict) => {
  return Object.entries(dict).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = isObjectPrototype(value) ? toQueryBody(value) : 1;
    }

    return acc;
  }, {});
};
