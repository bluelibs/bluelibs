// StackOverflow : https://stackoverflow.com/questions/679915/how-do-i-test-for-an-empty-javascript-object
export const isEmptyObject = (obj: object) =>
  obj && // 👈 null and undefined check
  Object.keys(obj).length === 0 &&
  isObjectPrototype(obj);

export const isObjectPrototype = (value) =>
  Object.getPrototypeOf(value) === Object.prototype;

/**
 * Will dumbly iterate through an array of objects to determine all the existing properties and merge it in a single object
 */
export const arrayToQueryBody = <T = object>(array: T[]) => {
  return array.reduce((acc, arrayRow) => {
    return Object.assign(acc, toQueryBody(arrayRow));
  }, {});
};

export const isArrayOfObjects = (value) =>
  // ! We have a problem in the condition below : how de we specify the body of an array of objects if the input array is empty ?
  Array.isArray(value) && value.length > 0 && isObjectPrototype(value[0]);

export const toQueryBody = (dict) => {
  // ? Here, could we have a way to ensure all the keys are valid in this collection ?
  // ? that would require the collection to know its graphql models / inputs

  if (isObjectPrototype(dict)) {
    return Object.entries(dict).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = isObjectPrototype(value)
          ? toQueryBody(value)
          : isArrayOfObjects(value)
          ? arrayToQueryBody(value as any[])
          : 1;
      }

      return acc;
    }, {});
  }

  if (isArrayOfObjects(dict)) {
    return arrayToQueryBody(dict);
  }

  return;
};
