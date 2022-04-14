import "@bluelibs/mongo-bundle";

export type LiveOptionsType = {
  /**
   * Disable live options
   */
  disable?: boolean;
  /**
   * To which custom channels to send this message.
   */
  channels?: string[];
};

declare module "@bluelibs/mongo-bundle" {
  export interface IExecutionContext {
    live?: LiveOptionsType;
  }
}
