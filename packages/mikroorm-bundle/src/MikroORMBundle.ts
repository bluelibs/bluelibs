import { Bundle } from "@bluelibs/core";
import { AnyEntity, EntitySchema, MikroORM } from "@mikro-orm/core";
import { MikroORMBundleConfigType, ORM } from "./defs";
import { EntityClass, EntityClassGroup } from "@mikro-orm/core/typings";

export type EntityInfoType =
  | string
  | EntityClass<AnyEntity>
  | EntityClassGroup<AnyEntity>
  | EntitySchema<any>;

export class MikroORMBundle extends Bundle<MikroORMBundleConfigType> {
  protected entities: EntityInfoType[] = [];

  async init() {
    // const entities = this.config.e
    const ormConfig = this.config.options;
    const entities = this.entities;
    if (ormConfig.entities) {
      entities.push(...ormConfig.entities);
    }

    const orm = await MikroORM.init({
      ...this.config.options,
      entities,
    });

    this.container.set({
      id: ORM,
      value: orm,
    });
  }

  load(entities: EntityInfoType[]) {
    this.entities.push(...entities);
  }

  async shutdown() {
    this.container.get(ORM).close();
  }
}
