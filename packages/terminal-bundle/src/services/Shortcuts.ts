import * as fuzzy from "fuzzy";
import { IPrompt } from "../defs";
import { DistinctQuestion } from "inquirer";

export class Shortcuts {
  static input(
    message: string,
    questionOptions: Partial<DistinctQuestion> = {}
  ) {
    return {
      question: {
        message,
        type: "input",
        ...questionOptions,
      },
    };
  }

  static confirm(
    message: string,
    defaultValue = true,
    questionOptions: Partial<DistinctQuestion> = {}
  ): IPrompt {
    return {
      question: {
        message,
        type: "confirm",
        ...questionOptions,
      },
      default: defaultValue,
    };
  }

  static autocomplete(
    message: string,
    list: string[] | IAutocompleteOption[],
    questionOptions: Partial<DistinctQuestion> = {},
    options?: {
      allowCustomValue?: boolean;
      defaultValue?: unknown;
    }
  ): IPrompt {
    const myList = formatList(list);
    const ids = myList.map((s) => s.id);

    return {
      default: options?.defaultValue,
      question: {
        type: "autocomplete",
        message: message,
        filter(id) {
          const element = myList.find((e) => e.id === id);

          return element?.value || id;
        },
        source: async function (_, input) {
          if (!input) {
            return ids;
          }

          const results = fuzzy.filter(input, ids);
          const found = results.map((el) => el.string);

          if (options?.allowCustomValue && found.length === 0) {
            return [input];
          }

          return found;
        },
        ...questionOptions,
      },
    };
  }
}

export interface IAutocompleteOption {
  id: string;
  // The value is passed through the prompt unchanged; it is consumer-defined.
  value: unknown;
}

function formatList(list: string[] | IAutocompleteOption[]) {
  if (typeof list[0] === "string") {
    return (list as string[]).map((s) => {
      return {
        id: s,
        value: s,
      };
    });
  } else {
    return list as IAutocompleteOption[];
  }
}
