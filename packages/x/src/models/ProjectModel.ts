export class ProjectModel {
  name: string;
  platform: string;
  startApiScript: string;
  startAdminScript: string;
  generateTypesScript: string;

  prepareScripts() {
    const seperator = this.platform === "win32" ? " && " : " ; ";
    this.startApiScript =
      "cd microservices/api" + seperator + "npm run start:dev";
    this.startAdminScript =
      "npm run generate:types" +
      seperator +
      "cd microservices/admin" +
      seperator +
      "npm run start:dev";
    this.generateTypesScript =
      "cd microservices/admin" + seperator + "npm run generate";
  }
}
