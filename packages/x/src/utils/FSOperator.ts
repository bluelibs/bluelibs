import * as fs from "fs";
import * as path from "path";
import * as fse from "fs-extra";
import * as handlebars from "handlebars";
import * as prettier from "prettier";
import { IBlueprintWriterSession } from "@bluelibs/terminal-bundle";
import { mergeTypeDefs, printTypeNode } from "@graphql-tools/merge";
import { printWithComments } from "@graphql-tools/utils";
import { XSession } from "./XSession";

const TPL_EXTENSION = ".tpl";
const TEMPLATES_DIR = __dirname + "/../../templates";

export type SessionCopyOptions = {
  ignoreIfExists?: boolean;
  ignoreIfContains?: string;
};

export const SessionCopyOptionsDefaults = {
  ignoreIfExists: false,
  ignoreIfContains: null,
};

/**
 * The purpose of this class is to perform FS operations on a Session for a given model that is passed to templates.
 */
export class FSOperator {
  constructor(public readonly session: XSession, public readonly model: any) {}

  isTemplate(content: string) {
    return Boolean(content.match("{{(.*)}}"));
  }

  add(paths: string | string[], fn) {
    this.session.addOperation({
      type: "custom",
      paths: Array.isArray(paths) ? paths : [paths],
      value: fn,
    });
  }

  getTemplatePath(templatePath: string) {
    return path.join(TEMPLATES_DIR, templatePath);
  }

  getTemplatePathCreator(prefix: string) {
    return (templatePath: string = "") => {
      return this.getTemplatePath(
        path.join(prefix, ...templatePath.split("/"))
      );
    };
  }

  getContents(fullPath: string) {
    return fs.readFileSync(fullPath).toString();
  }

  /**
   * Appends content only if it doesn't exist
   * @param filePath
   * @param content
   */
  sessionAppendFile(filePath, content) {
    this.add([filePath], () => {
      fse.ensureFileSync(filePath);
      let fileContent = this.getContents(filePath);
      content = this.renderTemplate(content, filePath);
      if (fileContent.indexOf(content) === -1) {
        fileContent = fileContent + content;
        this.writeFileSmartly(filePath, fileContent);
      }
    });
  }

  /**
   * Prepends content only if it does not exist
   * @param filePath
   * @param content
   */
  sessionPrependFile(filePath, content) {
    this.add([filePath], () => {
      fse.ensureFileSync(filePath);
      let fileContent = fs.readFileSync(filePath).toString();
      content = this.renderTemplate(content, filePath);

      if (fileContent.indexOf(content) === -1) {
        fileContent = content + fileContent;
        this.writeFileSmartly(filePath, fileContent);
      }
    });
  }

  sessionMergeTypeDefs(sourcePath, targetPath: string) {
    this.add([targetPath], () => {
      const mother = this.getContents(targetPath);
      const extension = this.renderTemplate(
        this.getContents(sourcePath),
        sourcePath
      );
      const contents =
        mother !== ""
          ? printWithComments(mergeTypeDefs([mother, extension]))
          : extension;

      this.writeFileSmartly(targetPath, contents);
    });
  }

  sessionWrite(filePath, content) {
    this.add([filePath], () => {
      fse.ensureFileSync(filePath);
      this.writeFileSmartly(filePath, content);
    });
  }

  /**
   * This method creates an operation which allows us to have dynamic folder names
   * And handlebars template files
   *
   * @param src
   * @param dest
   * @param model
   */
  sessionCopy(
    src,
    dest,
    options: SessionCopyOptions = SessionCopyOptionsDefaults
  ) {
    let paths;
    const isSourceADirectory = fs.lstatSync(src).isDirectory();

    if (isSourceADirectory) {
      paths = this.extractFiles(src, { includeFolders: true }).map((p) =>
        this.transformFilePath(p.replace(src, dest))
      );
    } else {
      paths = [this.transformFilePath(dest)];
    }

    this.add(paths, () => {
      let allFilePaths = isSourceADirectory ? this.extractFiles(src) : [src];
      fse.copySync(src, dest, {
        filter: (src, dest) => {
          const shouldOverride = this.shouldOverrideFileBasedOnOptions(
            dest,
            options
          );
          if (!shouldOverride) {
            allFilePaths = allFilePaths.filter((path) => path !== src);
          }

          return shouldOverride;
        },
      });

      // Process Templating
      allFilePaths.forEach((filePath) => {
        filePath = filePath.replace(src, dest);

        const content = this.getContents(filePath);

        this.writeFileSmartly(
          filePath,
          this.isTemplate(content)
            ? this.renderTemplate(content, filePath)
            : content,
          false
        );
      });

      // Rename Folders
      if (fs.lstatSync(dest).isDirectory()) {
        this.renameFiles(dest);
      } else {
        this.renameFile(dest);
      }
    });
  }

  /**
   * Renders the template for the current model
   */
  renderTemplate(content: string, filePath?: string, silent?: boolean): string {
    try {
      return handlebars.compile(content, {
        noEscape: true,
      })(this.model, {
        allowProtoMethodsByDefault: true,
        allowProtoPropertiesByDefault: true,
      });
    } catch (e) {
      console.error(`Error copying template over: `, { filePath }, e);
      throw e;
    }
  }

  /**
   * Writes the file prettier aware
   * @param filePath
   * @param content
   */
  writeFileSmartly(filePath, content, shouldRenderContent = true) {
    if (shouldRenderContent) content = this.renderTemplate(content, filePath);

    const prettierParserType = this.getPrettierParser(filePath);

    if (prettierParserType) {
      try {
        content = prettier.format(content, {
          trailingComma: "es5",
          tabWidth: 2,
          singleQuote: false,
          // @ts-ignore
          parser: prettierParserType,
        });
      } catch (e) {
        console.warn(
          `File ${filePath} could not be prettier formatted because it has an error`
        );
        console.warn(e);
      }
    }

    fs.writeFileSync(filePath, content);
  }

  /**
   * This ensures that the file path is transformed properly including renaming ___VARIABLE___ stuff
   * This does not do anything to the session
   * @param filePath
   * @param model
   */
  transformFilePath(filePath): string {
    if (path.extname(filePath) === TPL_EXTENSION) {
      filePath = filePath.slice(0, filePath.length - TPL_EXTENSION.length);
    }

    const extractions = filePath.match(/___([^_]+)___/g);

    if (extractions) {
      extractions.forEach((extraction) => {
        const variable = extraction.slice(3, extraction.length - 3);
        let value = this.model[variable];
        if (!value) {
          value = `VALUE_FOR_${variable}_NOT_FOUND`;
        }

        filePath = filePath.replace(extraction, value, "g");
      });
    }

    return filePath;
  }

  /**
   * Performs operations to file system
   */
  renameFiles(src) {
    const files = fs.readdirSync(src);

    files.forEach((file) => {
      if (file === "node_modules") {
        return;
      }
      const filePath = path.join(src, file);
      let stat = fs.lstatSync(filePath);
      if (stat.isFile()) {
        this.renameFile(filePath);
      } else {
        this.renameFiles(filePath);
      }
    });
  }

  renameFile(filePath) {
    const newFilePath = this.transformFilePath(filePath);
    if (filePath !== newFilePath) {
      fse.renameSync(filePath, newFilePath);
    }
  }

  /**
   * Extracts all the files and optionally folders from a path
   * @param src
   * @param options
   */
  extractFiles(src, options = { includeFolders: false }) {
    const filesArray = [];
    const files = fs.readdirSync(src);

    files.forEach((file) => {
      const filePath = path.join(src, file);
      const stat = fs.lstatSync(filePath);
      if (stat.isFile()) {
        filesArray.push(filePath);
      } else if (stat.isDirectory()) {
        if (options.includeFolders) {
          filesArray.push(filePath + "/");
        }
        filesArray.push(...this.extractFiles(filePath));
      }
    });

    return filesArray;
  }

  /**
   * Returns the correct parser for the file so it can be prettified.
   * @param filePath
   */
  getPrettierParser(filePath): string {
    const newFilePath = this.transformFilePath(filePath);
    const extName = path.extname(newFilePath);

    if (extName === ".ts") {
      return "babel-ts";
    }

    switch (extName) {
      case ".ts":
      case ".tsx":
        return "babel-ts";
      case ".gql":
      case ".graphql":
        return "graphql";
      case ".html":
        return "html";
      case ".json":
        return "json";
      case ".mdx":
      case ".md":
        return "markdown";
      case ".scss":
        return "scss";
      case ".css":
        return "css";
      case ".less":
        return "less";
    }
  }

  /**
   * Returns the nearest microservice
   * @param type
   * @param starting
   */
  getNearest(type: "microservice" | "project", starting = process.cwd()) {
    if (starting === "/") {
      throw new Error("Could not find a parent folder for type: " + type);
    }
    const filePath = path.join(starting, "package.json");

    if (fs.existsSync(filePath)) {
      const packageJson = fse.readJSONSync(filePath);
      if (packageJson.x && packageJson.x.type === type) {
        return path.dirname(filePath);
      }
    }

    return this.getNearest(type, path.join(starting, ".."));
  }

  /**
   * Here we check whether or not to override the file.
   * If the file exists and `options.ignoreIfExists` it will return false
   * If the file exists and contains `options.ignoreIfContains` it will return false
   * @param dest
   * @param options
   * @returns
   */
  protected shouldOverrideFileBasedOnOptions(
    dest,
    options: SessionCopyOptions
  ): boolean {
    if (this.session.isOverrideMode) {
      return true;
    }

    const filePath = this.transformFilePath(dest);

    if (!fs.existsSync(filePath)) {
      return true;
    }
    const isFile = !fs.lstatSync(filePath).isDirectory();

    if (isFile) {
      const exists = fs.existsSync(filePath);
      if (options.ignoreIfExists) {
        if (exists) {
          this.session.afterCommit(() => {
            const relativePath = path.relative(process.cwd(), filePath);
            console.log(
              `➤ File "${relativePath}" was not copied over because of it already exists.`
            );
          });
        }
        return !exists;
      }
      if (exists && options.ignoreIfContains) {
        const containsContent =
          fs
            .readFileSync(filePath)
            .toString()
            .indexOf(options.ignoreIfContains) !== -1;

        if (containsContent) {
          this.session.afterCommit(() => {
            const relativePath = path.relative(process.cwd(), filePath);
            console.log(
              `➤ File "${relativePath}" was not copied over because of its contents.`
            );
          });

          return false;
        }
      }
    }

    return true;
  }
}
