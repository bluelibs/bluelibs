type Constructor<T> = {
  new (...args: any[]): T;
};

export type ToModelOptions = {
  /**
   * When partial option is enabled the keys not present in the data option will be deleted.
   * This is relevant when you perform updates and you don't want the default values present.
   */
  partial: boolean;
};

export const ToModelOptionsDefaults: ToModelOptions = {
  partial: false,
};

export function toModel<T>(
  className: Constructor<T>,
  data: Partial<T>,
  options?: ToModelOptions
) {
  options = Object.assign({}, ToModelOptionsDefaults, options);
  if (data === null || data === undefined) {
    return null;
  }
  const newObject = Object.assign(new className(), data);

  if (options.partial) {
    const existingKeys = Object.keys(data);
    const newKeys = Object.keys(newObject);
    for (const newKey of newKeys) {
      if (!existingKeys.includes(newKey)) {
        delete newObject[newKey];
      }
    }
  }

  return newObject;
}
