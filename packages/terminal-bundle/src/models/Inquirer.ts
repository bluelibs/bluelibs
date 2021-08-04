import { IInquirer, IPrompt, IInquiryPromptOptions } from "../defs";
import { Inject, Service, EventManager } from "@bluelibs/core";
import { PrompterService } from "../services/PrompterService";
import { BeforePromptEvent, AfterPromptEvent } from "../events";

@Service({
  transient: true,
})
export abstract class Inquirer<T = any> implements IInquirer<T> {
  /**
   * The reason we want to have the model in the class is because we want it hackable via events
   */
  public model: T = {} as T;

  @Inject(() => EventManager)
  protected readonly eventManager: EventManager;

  @Inject(() => PrompterService)
  protected readonly prompter: PrompterService;

  abstract inquire(): Promise<void>;

  /**
   * Ask and fill the model
   */
  async prompt(
    field: string,
    prompt: IPrompt,
    options: IInquiryPromptOptions = { skipIfAlreadyExists: true, many: false }
  ) {
    // TODO: implement skipIfAlreadyExists logic, somehow?
    const eventData = {
      field,
      inquirer: this,
      prompt,
    };
    await this.eventManager.emit(new BeforePromptEvent(eventData));

    // Currently we do not support default values for "many"
    // This should be easily changeable in the future
    const newPrompt = {
      default: this.model ? this.model[field] : null,
      ...prompt,
    };

    // For many we should generate a new model each time.
    const value = options.many
      ? await this.prompter.promptMany(
          newPrompt,
          options.continuationMessage,
          options.autocontinue
        )
      : await this.prompter.prompt(newPrompt);

    await this.eventManager.emit(
      new AfterPromptEvent({
        ...eventData,
        value,
      })
    );

    this.model[field] = value;
  }

  filesMatching() {
    //
    // Find files matching X.collection.ts
    // Find files matching entities
  }
}
