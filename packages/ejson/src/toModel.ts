type Constructor<T> = {
  new (...args: any[]): T;
};

export function toModel<T>(className: Constructor<T>, data: Partial<T>) {
  if (data === null || data === undefined) {
    return null;
  }
  return Object.assign(new className(), data);
}
