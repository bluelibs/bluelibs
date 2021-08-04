import * as React from "react";

export type SmartSubscriber = (oldState, newState) => void | Promise<void>;
export type SetStateOptions = {
  /**
   * You run this when you want to perform multiple operations without dispatching changes yet. You have to manually call .inform() when ready
   */
  silent?: boolean;
};
export abstract class Smart<StateModel = any, Config = any> {
  public state: StateModel;
  public config: Config;
  public subscribers: SmartSubscriber[] = [];
  protected previousState?: StateModel;

  /**
   * This function should be called only once when the state is created
   * @param config
   */
  setConfig(config?: Config) {
    if (!config) {
      config = {} as Config;
    }
    this.config = config;
  }

  /**
   * Write code for initialisation like defining your state and others
   */
  async init(): Promise<void> {}

  /**
   * Write code for initialisation like defining your state and others
   */
  async destroy(): Promise<void> {}

  static getContext() {
    throw new Error(
      "Please implement the static getContext() method which returns a React context object."
    );
  }

  /**
   * Overrides the whole state with a new model.
   * @param newStateModel
   */
  setState(newStateModel: StateModel, options?: SetStateOptions) {
    if (this.isDebug()) {
      console.log(`Previous state`, this.state);
      console.log(`Next state`, newStateModel);
    }

    this.previousState = this.state;
    this.state = newStateModel;
    if (options?.silent) {
      // When it's silent we don't inform anyone, you have to manually call .inform()
    } else {
      this.inform();
    }
  }

  /**
   * Informs all subscribers of a new change.
   */
  inform(previousState?: StateModel) {
    if (this.isDebug()) {
      console.log(`Dispatching state change event`);
    }

    this.subscribers.forEach((subscriber) => {
      subscriber(previousState || this.previousState, this.state);
    });
  }

  /**
   * @param subscriber
   */
  protected subscribe(subscriber: SmartSubscriber) {
    if (this.subscribers.indexOf(subscriber) === -1) {
      this.subscribers.push(subscriber);
    }
  }

  /**
   * @param subscriber
   */
  protected unsubscribe(subscriber: SmartSubscriber) {
    this.subscribers = this.subscribers.filter((s) => s !== subscriber);
  }

  /**
   * Updates the state while preserving the other top-level variables
   * @param updateStateModel
   */
  updateState(
    updateStateModel: Partial<StateModel>,
    options?: SetStateOptions
  ) {
    this.setState(
      {
        ...this.state,
        ...updateStateModel,
      },
      options
    );
  }

  /**
   * If this is true it will log the previous state and next state
   * @returns boolean
   */
  isDebug() {
    return false;
  }
}
