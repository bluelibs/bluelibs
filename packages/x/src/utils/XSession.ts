import { Service } from "@bluelibs/core";
import { BlueprintWriterSession } from "@bluelibs/terminal-bundle";
import { FSUtils } from "./FSUtils";

/**
 * This session is microservice and project aware
 */
@Service({
  transient: true,
})
export class XSession extends BlueprintWriterSession {
  protected microservicePath: string;
  protected projectPath: string;

  /**
   * When this is set to true, all files that have the option "ignoreIfExists" OR "ignoreIfContains" will be as if they don't have the option at all
   */
  public isOverrideMode: boolean;

  getMicroservicePath(): string {
    return this.microservicePath || FSUtils.getNearest("microservice");
  }

  getProjectPath(): string {
    return this.projectPath || FSUtils.getNearest("project");
  }

  setMicroservicePath(path: string) {
    this.microservicePath = path;
  }

  getProjectName(): string {
    return FSUtils.getProjectName(this.getProjectPath());
  }

  setProjectPath(path: string) {
    this.projectPath = path;
  }
}
