import * as handlebars from "handlebars";
import * as fs from "fs";
import * as path from "path";

export const TEMPLATES_DIR = __dirname + "/../../templates/blueprint";
export const tpl = (tplPath) => {
  return path.join(TEMPLATES_DIR, tplPath);
};

const partials = [
  "formXElement",
  "formXElementForFiltering",
  "listItemRendition",
];

partials.forEach((partial) => {
  handlebars.registerPartial(
    partial,
    fs.readFileSync(tpl(`partials/${partial}.tpl`)).toString()
  );
});
