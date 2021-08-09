import { Users } from "./collections/Users";
import { generateProject, app } from "./utils";

const application = app({
  id: "vrex",
  sharedModels: [
    // Configure shared models
  ],
  collections: [Users],
});

generateProject(application, {
  // Mark this as true when you want to override even the non-overridable files
  override: true,
});
