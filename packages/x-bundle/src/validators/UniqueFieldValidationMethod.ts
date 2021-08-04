import { yup, IValidationMethod } from "@bluelibs/validator-bundle";
import { Collection } from "@bluelibs/mongo-bundle";
import { ContainerInstance, Constructor, Service } from "@bluelibs/core";

export interface IUniqueFieldValidationConfig {
  message?: string;
  field?: string;
  collection: Constructor<Collection<any>>;
}

@Service()
export class UniqueFieldValidationMethod
  implements IValidationMethod<IUniqueFieldValidationConfig> {
  parent = yup.mixed; // optional, defaults to yup.mixed, so to all
  name = "uniqueField";

  constructor(protected readonly container: ContainerInstance) {}

  async validate(
    value: string,
    config: IUniqueFieldValidationConfig,
    { createError, path }
  ) {
    let { collection, field, message } = config;
    if (!field) {
      field = path;
    }
    // search to see if that field exists

    const collectionObject = this.container.get<Collection>(collection);

    const found = await collectionObject.findOne(
      {
        [field]: value,
      },
      {
        projection: {
          _id: 1,
        },
      }
    );

    if (found) {
      createError(
        message || `The value for this field ${field} already exists.`
      );
      return;
    }

    return "ok";
  }
}
