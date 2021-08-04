import { Service } from "@bluelibs/core";
import { yup, IValidationTransformer } from "@bluelibs/validator-bundle";
import { parse } from "date-fns";

type IDateTransformerConfig = string;

@Service()
export class DateTransformer
  implements IValidationTransformer<IDateTransformerConfig, Date> {
  parent = yup.date;
  name = "format";

  // Note that this is not async
  // Transformers do not support async out of the box in yup
  transform(value, originalValue, format, schema) {
    if (value instanceof Date) {
      return value;
    }

    // https://date-fns.org/v2.14.0/docs/format
    return parse(value, format, new Date());
  }
}
