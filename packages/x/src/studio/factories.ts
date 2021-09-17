import { FactoryFunction, DeepPartial } from "./defs";
import { Collection, Field, SharedModel, Relation } from "./models";
import { App, BaseModel } from "./models/App";
import { FieldValueKind } from "./models/FieldValueKind";
import { shortcuts } from "./shortcuts/index";

export const app: FactoryFunction<App, ["id"]> = (config) => {
  const model = new App();
  model.blend(config);

  return model;
};

export const collection: FactoryFunction<Collection, ["id"]> = (config) => {
  const model = new Collection();
  model.blend(config);

  // Automatically add an _id if it isn't found
  if (!model.fields.find((f) => f.id === "_id")) {
    model.fields = [shortcuts.field.id(), ...model.fields];
  }

  return model;
};

export type FieldFactoryShortcut = (
  id: string,
  config?: DeepPartial<Field>
) => Field;
export type FieldFactoryFunction<T, RT extends (keyof T)[]> = FactoryFunction<
  T,
  RT
> & {
  types: typeof FieldValueKind;
  string: FieldFactoryShortcut;
  enum: FieldFactoryShortcut;
  integer: FieldFactoryShortcut;
  float: FieldFactoryShortcut;
  date: FieldFactoryShortcut;
  boolean: FieldFactoryShortcut;
  object: FieldFactoryShortcut;
};

export const field: FieldFactoryFunction<Field, ["id", "type"]> = (config) => {
  const model = new Field();
  model.blend(config);

  return model;
};

field.types = FieldValueKind;

export const relation: FactoryFunction<Relation, ["id", "to"]> = (config) => {
  const model = new Relation();
  model.blend(config);

  return model;
};

export const sharedModel: FactoryFunction<SharedModel, ["id", "fields"]> = (
  config
) => {
  const model = new SharedModel();
  model.blend(config);

  return model;
};

// FIELD SHORTCUTS
type FieldShortcutFactoryFunction = (id, config?: Partial<Field>) => Field;

const fieldShortcutFactory = (type): FieldShortcutFactoryFunction => {
  return (id, config = {}) => {
    return field({
      id,
      type,
      ...(config || {}),
    });
  };
};

field.string = fieldShortcutFactory(FieldValueKind.STRING);
field.enum = fieldShortcutFactory(FieldValueKind.ENUM);
field.integer = fieldShortcutFactory(FieldValueKind.INTEGER);
field.float = fieldShortcutFactory(FieldValueKind.FLOAT);
field.date = fieldShortcutFactory(FieldValueKind.DATE);
field.boolean = fieldShortcutFactory(FieldValueKind.BOOLEAN);
field.object = fieldShortcutFactory(FieldValueKind.OBJECT);
