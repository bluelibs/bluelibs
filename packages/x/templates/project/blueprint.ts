import { Studio } from "@kaviar/x";
import * as faker from "faker";

const {
  generateProject,
  app,
  collection,
  field,
  relation,
  shortcuts,
  sharedModel,
  GeneratorKind,
} = Studio;

const blogs = app({
  id: "{{ name }}",
  sharedModels: [
    // Configure shared models
  ],
  collections: [
    collection({
      id: "Users",
      behaviors: {
        softdeletable: true,
      },
      mock: {
        count: 10,
      },
      fields: [
        // Standard fields present for user (isEnabled, createdAt)
        ...shortcuts.fields.user.standard(),
        // Information about password storage (hash, email, etc)
        shortcuts.field.user.password(),
        shortcuts.field.softdeletable(),
        ...shortcuts.fields.timestampable(),
        field({
          id: "roles",
          type: field.types.ENUM,
          enumValues: ["ADMIN", "USER", "EMPLOYEEE"],
          isArray: true,
          mock: {
            generator: () => ["ADMIN"],
          },
        }),
        field({
          id: "fullName",
          type: field.types.STRING,
          isReducer: true,
        }),
        field({
          id: "email",
          type: field.types.STRING,
          isReducer: true,
        }),
      ],
      relations: [...shortcuts.relations.blameable()],
    }),
  ],
});

generateProject(blogs, {
  // Mark this as true when you want to override even the non-overridable files
  // override: true,
});
