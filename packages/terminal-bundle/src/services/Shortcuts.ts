import * as fuzzy from "fuzzy";
import { IPrompt } from "../defs";

export class Shortcuts {
  static input(message: string, questionOptions = {}) {
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
    questionOptions = {}
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
    message,
    list: string[] | IAutocompleteOption[],
    questionOptions = {},
    options?: {
      allowCustomValue?: boolean;
      defaultValue?: any;
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
  id: any;
  value: any;
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
