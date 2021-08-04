import { FactoryFunction } from "./defs";
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

export type FieldFactoryFunction<T, RT extends (keyof T)[]> = FactoryFunction<
  T,
  RT
> & {
  types: typeof FieldValueKind;
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
