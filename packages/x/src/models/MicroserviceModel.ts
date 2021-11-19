export class MicroserviceModel {
  name: string;
  type: MicroserviceTypeEnum;
  projectName: string;
  /**
   * Applies to frontend only
   */
  adminMode: boolean;
}

export class BackendMicroserviceModel extends MicroserviceModel {
  hasUsers: boolean;
  hasUploads: boolean;
  /**
   * When generating the backend microservice the first time it's nice to add the users automatically
   * However, when dealing with the generator, you might want to set this to false and let the generator handle this.
   */
  createUsersCollection: boolean = true;
}

export class FrontendReactMicroserviceModel extends MicroserviceModel {
  hasCustomGuardian: boolean;
}

export class FrontendNextMicroserviceModel extends MicroserviceModel {
  hasCustomGuardian: boolean;
}

export enum MicroserviceTypeEnum {
  BACKEND = "backend",
  FRONTEND_REACT = "frontend-react",
  FRONTEND_NEXT = "frontend-next",
}
