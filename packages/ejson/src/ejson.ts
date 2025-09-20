import { EJSONModule } from "./EJSONModule";

// EJSON is an isolated instance by default.
export const EJSON = new EJSONModule();

// Re-export the constructor for creating additional isolated instances.
export { EJSONModule };
export { EJSONModule as EJSONModel };
