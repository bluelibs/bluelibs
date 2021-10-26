## Install

```bash
npm i -S yup @bluelibs/validator-bundle
```

```ts
const kernel = new Kernel({
  bundles: [new ValidatorBundle()],
});
```

## Purpose

This package blends [yup validation package](https://github.com/jquense/yup) with class decorators inside TypeScript inside the ecosystem, opening the path of having asynchronous container-aware validation logic, as well as a means of describing the model in an OOP-fashion.

## Usage

Let's create an input for registration in which we ask `email` and `age` but at the same time we link with another schema.

```typescript
import { a, an, Is, Schema } from "@bluelibs/validator-bundle";

// a, an === yup basically
@Schema()
class UserRegistrationInput {
  @Is(a.string().email())
  email: string;

  @Is(a.number().lessThan(150).moreThan(18))
  age: number;

  // Basically when you're dealing with external classes use a function and use Schema.from(class)
  @Is(() => Schema.from(ProfileRegistrationInput))
  profile: ProfileRegistrationInput;
}

@Schema()
export class ProfileRegistrationInput {
  @Is(a.string())
  firstName: string;

  @Is(a.string())
  lastName: string;
}
```

:::note
What `Schema()` does essentially it states that it will construct an `yup.object()` instance with the details defined for each field. Allowing you to have additional fields that don't get validated, or other helper methods giving you full control.
:::

To perform validation, we make use of the `ValidatorService`:

```typescript
import { ValidatorService } from "@bluelibs/validator-bundle";

const validatorService = container.get(ValidatorService);

validatorService.validate(dataSet, {
  model: UserRegistrationInput,
  ...otherOptionsFromYup, // found in it's official documentation
});
```

## Custom Validation

We are about to introduce customly designed validations that know about the `container` and can use it. For illustration purposes we're going to design something that checks whether a field is unique or not in the database.

```typescript
import { Service, Inject } from "@bluelibs/core";
import {
  yup,
  IValidationMethod,
  TestContext,
} from "@bluelibs/validator-bundle";

export type UniqueFieldConfig = {
  message?: string;
  // We ask for "table" and "field"
  table: string;
  field: string;
};

@Service()
class UniqueFieldValidator implements IValidationMethod<UniqueFieldConfig> {
  // What is your string like, which you want to validate?
  parent = yup.string; // optional, defaults to yup.mixed, so to all
  name = "uniqueField";

  constructor() {
    // Note that you can inject any dependency in the constructor, in our case, a database or api service
  }

  async validate(
    value: string,
    config: IUniqueFieldValidationConfig,
    context: TestContext
  ) {
    // The 3d argument, the context, can be found here:
    // https://github.com/jquense/yup#mixedtestname-string-message-string--function-test-function-schema

    const { table, field, message } = config;
    let valueAlreadyExists; /* search to see if that field exists */

    if (valueAlreadyExists) {
      // This does not actually throw so the execution will continue
      context.createError(message || `The field already exists`);
    } else {
      // This is yup's way of saying the validation has worked ok.
      return true;
    }
  }
}
```

Now we have to tell `TypeScript` about this so it can provide us with propper type-safety when using `@Is(a.string().uniqueField({ table: "users", field: "email" }))`

```typescript
// declarations.ts
import * as yup from "yup";
import { IUniqueFieldValidationConfig } from "./validator.ts";

/**
 * We need to be able to have autocompletion and extend the "yup" from within our validator.
 */
declare module "yup" {
  export class StringSchema extends yup.StringSchema {
    /**
     * Specify a unique constraint for this field
     */
    uniqueField(config?: IUniqueFieldValidationConfig): StringSchema;
  }
}
```

The next step is to let the `ValidatorService` know about this custom method, it should be added in the `prepare()` phase of your bundle:

```typescript
class AppBundle extends Bundle {
  async prepare() {
    const validatorService = this.container.get(ValidatorService);

    validatorService.addMethod(UniqueFieldValidationMethod);
  }
}
```

Now you could safely use it like this:

```typescript
@Schema()
class UserRegistrationInput {
  @Is(
    a.string().email().uniqueField({
      table: "users",
      field: "email",
    })
  )
  email: string;
}
```

## Transformers

Let's say you receive from inputs a date, but not an object `Date`, a string, "2018-12-04" you want to make it a `Date` instance, so you would want to "cast" it. That's done via transformers:

```typescript
import { Service } from "@bluelibs/core";
import * as moment from "moment";
import { yup, IValidationTransformer } from "@bluelibs/validator-bundle";

type IDateTransformerConfig = string;

@Service()
class DateTransformer implements IValidationTransformer<IDateTransformerConfig, Date> {
  // What is your string like, which you want to validate?
  parent = yup.date, // optional, defaults to yup.mixed, so to all
  name = "format";

  // Note that this is not async
  // Transformers do not support async out of the box in yup
  transform(value: string, originalValue, format, schema) {
    if (value instanceof Date) {
      return value;
    }

    const date = moment(value, format || 'YYYY-MM-DD');

    return date.isValid() ? date.toDate() : new Date();
  }
}
```

You can add it to TypeScript declarations in the same manner as we've seen for the Validator above:

```typescript
class AppBundle extends Bundle {
  async prepare() {
    const validatorService = this.container.get(ValidatorService);
    validatorService.addTransformer(DateTransformer);
  }
}
```

Now you could safely use it like this:

```typescript
@Schema()
class PostCreateInput {
  @Is(a.date().format())
  publishAt: Date;
}

const input = {
  publishAt: "2050-12-31", // Remember this date.
};

const object = validatorService.validate(input, {
  model: PostCreateInput,
});

// Casting has been doen automatically, if you want just casting: validatorService.cast(input)
object.publishAt; // instanceof Date now
```

## Meta

### Summary

`Yup` is already well-established as an excellent validation library with a lot of great features and customisability, we bring that sheer power into BlueLibs and integrate it seamlessly so you can use it at its full capacity.

### Boilerplates

- [ValidatorBundle](https://stackblitz.com/edit/node-ndk84t?file=README.md)

### Challenges

- Using `yup` create an input with `newPassword` and `confirmPassword` as fields and ensure they are at least 8 characters in length and they are both equal. (1p)
- Create an asynchronous validator, which says whether input is a valid country. (1p) `@Is(a.string().country())`
