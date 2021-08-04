export interface IXGeneratorBundleConfig {
  /**
   * This is used when you want to use x-generator-bundle in another environment
   * For example make use of it's writers but write your own commands and etc
   */
  supressInitialisation: boolean;
}
