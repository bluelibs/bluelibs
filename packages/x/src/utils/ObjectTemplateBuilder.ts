export type ObjectTemplateBuilderConstructorOptions = {
  strings?: string[];
  data?: object;
};

export class ObjectTemplateBuilder {
  result = "";
  options: ObjectTemplateBuilderConstructorOptions;

  constructor(options: ObjectTemplateBuilderConstructorOptions = {}) {
    if (!options.strings) {
      options.strings = [];
    }
    if (options.data) {
      this.merge(options.data);
    }
  }

  merge(data: object) {
    for (let key in data) {
      this.push(key, data[key]);
    }
  }

  push(field: string, value) {
    if (
      Array.isArray(value) &&
      value.length &&
      value[0] instanceof ObjectTemplateBuilder
    ) {
      this.result += `[ ${value.map((v) => v.toString()).join(",\n")} ]`;
      return;
    }

    if (value instanceof ObjectTemplateBuilder) {
      value = value.toString();
    } else {
      if (typeof value !== "string") {
        value = JSON.stringify(value);
      }
    }

    if (this.options.strings.includes(field)) {
      value = `"${value}"`;
    }

    this.result += `"${field}": ${value},\n`;
  }

  render() {
    return `{ ${this.result} }`;
  }

  toString() {
    return this.render();
  }
}
