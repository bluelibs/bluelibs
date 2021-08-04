import {
  IBlueprintWriterSession,
  IBlueprintTemplate,
  IBlueprintWriterOperation,
  IBlueprintSessionCommitOptions,
} from "../defs";
import {
  Service,
  Constructor,
  ContainerInstance,
  Inject,
} from "@bluelibs/core";
import * as path from "path";
import * as fs from "fs";
import * as mkdirp from "mkdirp";
import * as mergeDeep from "merge-deep";
import recursiveCopy from "recursive-copy";

@Service({
  transient: true,
})
export class BlueprintWriterSession implements IBlueprintWriterSession {
  protected operations: IBlueprintWriterOperation[] = [];
  /**
   * This contains a list of handlers that are mandatory to run.
   */
  protected afterCommitHandlers: ((...args: any[]) => any)[] = [];
  /**
   * This is used specifically to leave information
   * When doing large-scale generations we want to avoid this
   */
  protected afterCommitInstructions: ((...args: any[]) => any)[] = [];

  @Inject()
  protected readonly container: ContainerInstance;

  mkdir(dirPath: string) {
    this.operations.push({
      type: "mkdirp",
      paths: [dirPath],
    });

    return this;
  }

  copyDir(dirPath, toPath, options = {}) {
    this.operations.push({
      type: "copyDir",
      paths: [toPath],
      value: {
        source: dirPath,
        options,
      },
    });

    return this;
  }

  write(filePath: string, content: string) {
    this.operations.push({
      type: "write",
      paths: [filePath],
      value: content,
    });

    return this;
  }

  append(filePath: string, content: string) {
    this.operations.push({
      type: "append",
      paths: [filePath],
      value: content + "\n",
    });

    return this;
  }

  prepend(filePath: string, content: string) {
    this.operations.push({
      type: "prepend",
      paths: [filePath],
      value: content + "\n",
    });

    return this;
  }

  installNpmPackage(
    name: string,
    version: string,
    options: { dev?: boolean; rootDir?: string } = { dev: false }
  ) {
    this.operations.push({
      type: "deep-extend-json",
      paths: options.rootDir
        ? [path.join(options.rootDir, "package.json")]
        : ["package.json"],
      value: {
        [options.dev ? "devDependencies" : "dependencies"]: {
          [name]: version,
        },
      },
    });

    return this;
  }

  addEnvironmentVariable(name: string, value: string) {
    this.operations.push({
      type: "append",
      paths: [".env"],
      value: `${name}=${value}`,
    });

    return this;
  }

  /**
   * Adds an operation to the queue
   * @param operation
   */
  addOperation(operation: IBlueprintWriterOperation) {
    this.operations.push(operation);

    return this;
  }

  async commit(options?: IBlueprintSessionCommitOptions): Promise<void> {
    // Work through all operations
    // Perform file system operations
    let contents;
    for (const operation of this.operations) {
      if (options?.verbose) {
        console.log(operation);
      }
      switch (operation.type) {
        case "copyDir":
          const { source, options } = operation.value;
          await recursiveCopy(source, operation.paths[0], options);

          break;
        case "mkdirp":
          await mkdirp(operation.paths[0]);
          break;
        case "append":
          await this.ensureFileExists(operation.paths[0]);
          contents = fs.readFileSync(operation.paths[0]);
          fs.writeFileSync(
            operation.paths[0],
            contents.toString() + operation.value
          );
          break;
        case "prepend":
          await this.ensureFileExists(operation.paths[0]);
          contents = fs.readFileSync(operation.paths[0]);
          fs.writeFileSync(
            operation.paths[0],
            operation.value + contents.toString()
          );
          break;
        case "deep-extend-json":
          this.ensureFileExists(operation.paths[0], "{}");
          const jsonFile = fs.readFileSync(operation.paths[0]);
          const jsonObject = JSON.parse(jsonFile.toString());
          const newObject = mergeDeep(jsonObject, operation.value);

          fs.writeFileSync(
            operation.paths[0],
            JSON.stringify(newObject, null, 2)
          );
          break;
        case "write":
          this.ensureFolderExistsForFilePath(operation.paths[0]);
          fs.writeFileSync(operation.paths[0], operation.value, {
            flag: "w",
          });
          break;
        case "custom":
          await operation.value();
          break;
        default:
          throw new Error(`Operation type "${operation.type}" not recognised.`);
      }
    }

    this.operations = [];
    for (const afterCommitHandler of this.afterCommitHandlers) {
      await afterCommitHandler();
    }
    this.afterCommitHandlers = [];
    if (!options?.skipInstructions) {
      for (const afterCommitHandler of this.afterCommitInstructions) {
        await afterCommitHandler();
      }
    }
    this.afterCommitInstructions = [];
  }

  /**
   * Register a function to execute after commit has been made
   * @param handler
   */
  afterCommit(handler) {
    this.afterCommitHandlers.push(handler);

    return this;
  }

  /**
   * Register a function to execute after commit has been made
   * @param handler
   */
  afterCommitInstruction(handler) {
    this.afterCommitInstructions.push(handler);

    return this;
  }

  getAllAffectedPaths(showRelative = false): string[] {
    const paths = [];
    const currentDir = process.cwd();

    this.operations.forEach((operation) => {
      if (showRelative) {
        paths.push(...operation.paths.map((p) => p.replace(currentDir, "")));
      } else {
        paths.push(...operation.paths);
      }
    });

    paths.sort();

    return paths;
  }

  /**
   * Makes sure the folder for the path exists
   * @param filePath
   */
  protected async ensureFolderExistsForFilePath(filePath: string) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      await mkdirp(dir);
    }
  }

  /**
   * Makes sure the file path is writable
   * @param filePath
   * @param contents
   */
  protected async ensureFileExists(filePath: string, contents = "") {
    if (!fs.existsSync(filePath)) {
      await this.ensureFolderExistsForFilePath(filePath);
      fs.writeFileSync(filePath, contents);
    }
  }
}
