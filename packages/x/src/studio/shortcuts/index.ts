import * as s from "../factories";
import * as _ from "lodash";
import { Field, Relation } from "../models";
import timezones from "./timezones";

export type BlameableRelationOverrideType = {
  created: Partial<Relation>;
  updated: Partial<Relation>;
};

export type TimestampableFieldsOverrideType = {
  created: Partial<Field>;
  updated: Partial<Field>;
};

export const shortcuts = {
  field: {
    id() {
      return s.field({
        id: "_id",
        type: s.field.types.OBJECT_ID,
        isRequired: false,
        ui: {
          label: "ID",
          create: false,
          edit: false,
        },
      });
    },
    timezone(fieldId: string = "timezone", override: Partial<Field> = {}) {
      return s.field({
        id: fieldId,
        type: s.field.types.ENUM,
        enumValues: timezones,
      });
    },
    softdeletable() {
      return s.field({
        id: "isDeleted",
        description:
          "This field is used to identify if this object has been soft-deleted",
        type: s.field.types.BOOLEAN,
        enableGraphQL: false,
        isRequired: false,
        ui: false,
        mock: {
          generator: () => false,
        },
      });
    },
    user: {
      password() {
        return s.field({
          id: "password",
          type: s.field.types.OBJECT,
          enableGraphQL: false,
          isRequired: true,
          description:
            "This is the model that stores password authentication data such as emails, hashed password, salt and other security related data",
          genericFieldSubmodel: {
            name: "IPasswordAuthenticationStrategy",
            storage: "outside",
            local: false,
            absoluteImport: "@bluelibs/password-bundle",
            isInterface: true,
          },
          ui: false,
        });
      },
    },
  },
  fields: {
    timestampable(
      overrides: TimestampableFieldsOverrideType = { created: {}, updated: {} }
    ) {
      const createdOptions = {
        id: "createdAt",
        isRequired: true,
        description: "Represents the date when this object was created",
        type: s.field.types.DATE,
        ui: {
          edit: false,
          create: false,
        },
      };
      _.merge(createdOptions, overrides.created);

      const updatedOptions = {
        id: "updatedAt",
        isRequired: true,
        description: "Represents the last time when the object was updated",
        type: s.field.types.DATE,
        ui: {
          edit: false,
          create: false,
        },
      };
      _.merge(updatedOptions, overrides.updated);

      return [s.field(createdOptions), s.field(updatedOptions)];
    },
    /**
     * If you use blameable relation you don't need these fields, as they are automatically added
     * @returns
     */
    blameable() {
      return [
        s.field({
          id: "createdById",
          type: s.field.types.OBJECT_ID,
          isRequired: true,
          ui: {
            edit: false,
            create: false,
            listFilters: false,
          },
        }),
        s.field({
          id: "updatedById",
          isRequired: true,
          type: s.field.types.OBJECT_ID,
          ui: {
            edit: false,
            create: false,
            listFilters: false,
          },
        }),
      ];
    },
    user: {
      standard() {
        return [
          s.field({
            id: "profile",
            type: s.field.types.OBJECT,
            isRequired: true,
            subfields: [
              s.field({
                id: "firstName",
                isRequired: true,
                type: s.field.types.STRING,
              }),
              s.field({
                id: "lastName",
                isRequired: true,
                type: s.field.types.STRING,
              }),
            ],
          }),
          s.field({
            id: "isEnabled",
            isRequired: true,
            type: s.field.types.BOOLEAN,
            mock: {
              generator: () => true,
            },
          }),
          s.field({
            id: "createdAt",
            isRequired: true,
            type: s.field.types.DATE,
            ui: {
              create: false,
              edit: false,
            },
          }),
        ];
      },
    },
  },
  relation: {
    /**
     * This is used for when you want to link with an owner user. Adding the field is optional
     * @returns
     */
    user(override: Partial<Relation> = {}) {
      const id = override.id || "user";
      const fieldId = `${id}Id`;
      return s.relation({
        id,
        to: "Users",
        field: s.field({
          id: fieldId,
          type: s.field.types.OBJECT_ID,
        }),
        ui: {
          label: "Owner",
          create: true,
          edit: true,
          list: true,
          listFilters: true,
          view: true,
        },
        representedBy: "fullName",
        mock: {
          useExistingDocuments: true,
        },
        isRequired: true,
        ...override,
      });
    },
    file(id: string, override: Partial<Relation> = {}) {
      const options = {
        id: id,
        to: "AppFiles",
        isMany: false,
        field: s.field({
          id: `${id}Id`,
          type: s.field.types.OBJECT_ID,
        }),
        ui: {
          create: true,
          edit: true,
          list: true,
          listFilters: false,
          view: true,
        },
        isRequired: false,
      };
      _.merge(options, override);

      return s.relation(options);
    },
    files(id: string, override: Partial<Relation> = {}) {
      const options: Partial<Relation> = {
        id: id,
        to: "AppFiles",
        isMany: true,
        field: s.field({
          id: `${id}Ids`,
          type: s.field.types.OBJECT_ID,
          isArray: true,
        }),
        ui: {
          create: true,
          edit: true,
          list: true,
          listFilters: false,
          view: true,
        },
        isRequired: false,
      };
      _.merge(options, override);

      return s.relation(options as Relation);
    },
    fileGroup(id: string, override: Partial<Relation> = {}) {
      const options = {
        id: id,
        to: "AppFileGroups",
        isMany: false,
        field: s.field({
          id: `${id}Id`,
          type: s.field.types.OBJECT_ID,
        }),
        ui: {
          create: true,
          edit: true,
          list: true,
          listFilters: false,
          view: true,
        },
        isRequired: false,
        ...override,
      };
      _.merge(options, override);

      return s.relation(options);
    },
  },
  relations: {
    blameable(
      overrides: BlameableRelationOverrideType = { created: {}, updated: {} }
    ) {
      const createdOptions: Partial<Relation> = {
        id: "createdBy",
        isRequired: false,
        to: "Users",
        description: "Represents the user who has created this object",
        field: s.field({
          id: "createdById",
          type: s.field.types.OBJECT_ID,
          isRequired: false,
          description: "Represents the user's id who has created this object",
        }),
        ui: {
          label: "Created By",
          create: false,
          edit: false,
        },
        representedBy: "fullName",
        mock: {
          useExistingDocuments: true,
        },
      };
      _.merge(createdOptions, overrides.created);

      const updatedOptions = {
        id: "updatedBy",
        to: "Users",
        description:
          "Represents the user who has made the latest update on this object",
        field: s.field({
          id: "updatedById",
          type: s.field.types.OBJECT_ID,
          isRequired: false,
          description:
            "Represents the user's id who has made the latest update on this object",
        }),
        isRequired: false,
        ui: {
          label: "Updated By",
          create: false,
          edit: false,
        },
        representedBy: "fullName",
        mock: {
          useExistingDocuments: true,
        },
      };
      _.merge(updatedOptions, overrides.updated);

      return [
        s.relation(createdOptions as Relation),
        s.relation(updatedOptions),
      ];
    },
  },
};
