import * as fs from "fs";
import * as path from "path";
import * as fse from "fs-extra";
import { NearestElementNotFoundException } from "../exceptions/NearestElementNotFound.exception";

const TEMPLATES_DIR = __dirname + "/../../templates";

/**
 * A hack to allow using microservice path when the command isn't executed in the context of a microservice
 * For example, when creating a new microservice and we want to add collections, other x elements, when using the writer,
 * the writer gets the microservice path
 */
let MICROSERVICE_PATH = null;
export class FSUtils {
  /**
   * Use it when creating microservices and there isn't a one set yet
   * @param path
   */
  static setMicroservicePathOverride(path: string | null) {
    MICROSERVICE_PATH = path;
  }

  static getNearest(
    type: "microservice" | "project",
    starting = process.cwd()
  ) {
    if (type === "microservice" && MICROSERVICE_PATH) {
      return MICROSERVICE_PATH;
    }

    if (starting === "/") {
      throw new NearestElementNotFoundException({ type });
    }
    const filePath = path.join(starting, "package.json");

    if (fs.existsSync(filePath)) {
      const packageJson = fse.readJSONSync(filePath);
      if (packageJson.bluelibs && packageJson.bluelibs.type === type) {
        return path.dirname(filePath);
      }
    }

    return this.getNearest(type, path.join(starting, ".."));
  }

  static getProjectName(projectPath?: string) {
    projectPath = projectPath ?? this.getNearest("project");
    const packageJson = fse.readJSONSync(
      path.join(projectPath, "package.json")
    );

    return packageJson.name;
  }

  static listBundles(microservicePath) {
    const basePath = path.join(microservicePath, "src", "bundles");
    const allFiles = fs.readdirSync(basePath);

    return allFiles.filter((file) =>
      fs.lstatSync(path.join(basePath, file)).isDirectory()
    );
  }

  static bundlePath(
    microserviceDir: string,
    bundleName: string,
    suffixPath: string = ""
  ) {
    return path.join(microserviceDir, "src", "bundles", bundleName, suffixPath);
  }

  static getTemplatePath(templatePath: string) {
    templatePath = path.join(...templatePath.split("/"));
    return path.join(TEMPLATES_DIR, templatePath);
  }

  static getTemplatePathCreator(prefix: string) {
    return (templatePath: string = "") => {
      templatePath = path.join(...templatePath.split("/"));
      return this.getTemplatePath(path.join(prefix, templatePath));
    };
  }
}
