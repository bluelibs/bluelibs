import { Inquirer, Shortcuts } from "@bluelibs/terminal-bundle";
import { ProjectModel } from "../models";

export class ProjectInquirer extends Inquirer<ProjectModel> {
  model = new ProjectModel();

  async inquire() {
    await this.prompt("name", Shortcuts.input("Enter the name of the project"));
  }
}
