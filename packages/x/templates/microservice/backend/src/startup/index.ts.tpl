import "./env";
import { kernel } from "./kernel";
import "./bundles";

kernel.init().catch((e) => {
  console.error(e);
  process.exit(0);
});
