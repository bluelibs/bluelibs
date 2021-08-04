import {
  Schema,
  Is,
  a,
  an,
  ValidatorService,
  IValidationMethod,
  yup,
  IValidationTransformer,
  Nested,
} from "..";
import { ContainerInstance } from "@bluelibs/core";
import { ValidationError, StringSchema, TestContext } from "yup";
import { ITestStringSchema } from "./defs.test";

describe("ValidatorService", () => {
  test("should work with simple validation", async () => {
    @Schema()
    class User {
      @Is(a.string().max(10))
      name: string;
    }

    const container = new ContainerInstance(Math.random().toString());
    const validator = new ValidatorService(container);

    const result = await validator.validate(
      {
        name: "123456789",
      },
      {
        model: User,
      }
    );

    expect(result.name).toBe("123456789");

    await expect(
      validator.validate(
        {
          name: "12345678910",
        },
        {
          model: User,
        }
      )
    ).rejects.toBeInstanceOf(ValidationError);

    const user = new User();
    user.name = "123456789";

    const result2 = await validator.validate(user);

    expect(result2).toBeInstanceOf(User);
    expect(result2.name).toBe("123456789");

    user.name = "12345678910";
    await expect(validator.validate(user)).rejects.toBeInstanceOf(
      ValidationError
    );
  });

  test("should be able to add a custom validator async, container aware", async () => {
    const container = new ContainerInstance(Math.random().toString());
    const validator = new ValidatorService(container);

    class IsABomb implements IValidationMethod {
      // What is your string like, which you want to validate?
      parent = yup.string; // optional, defaults to yup.mixed
      name = "isNotBomb";

      constructor() {
        // Note that you can inject any dependency in the constructor, in our case, a database or api service
      }

      async validate(value: string, suffix: string, yupContext: TestContext) {
        // to ensure async
        if (value === "bomb" + (suffix ? suffix : "")) {
          yupContext.createError({ message: "boom!" });
        } else {
          return "ok";
        }
      }
    }

    validator.addMethod(IsABomb);

    @Schema()
    class Package {
      @Is(() => (a.string() as ITestStringSchema).isNotBomb())
      name: string;
    }

    const pack = new Package();
    pack.name = "bomb";

    await expect(validator.validate(pack)).rejects.toBeInstanceOf(
      ValidationError
    );

    pack.name = "notbomb";

    @Schema()
    class Package2 {
      @Is(() => (a.string() as ITestStringSchema).isNotBomb("zz"))
      name: string;
    }

    const pack2 = new Package2();
    pack2.name = "bombzz";

    await expect(validator.validate(pack2)).rejects.toBeInstanceOf(
      ValidationError
    );

    pack2.name = "bombzzz";
    await validator.validate(pack2);
  });

  test("should be able to add a custom transformer async", async () => {
    const container = new ContainerInstance(Math.random().toString());
    const validator = new ValidatorService(container);

    class ReverseTransformer implements IValidationTransformer<string, string> {
      // What is your string like, which you want to validate?
      parent = yup.string; // optional, defaults to yup.mixed
      name = "reverse";

      transform(value: string, originalValue: string, suffix: string, schema) {
        return value.split("").reverse().join("");
      }
    }

    validator.addTransformer(ReverseTransformer);

    @Schema()
    class Package {
      @Is((a.string() as ITestStringSchema).reverse())
      name: string;
    }

    const pack = new Package();
    pack.name = "bomb";

    const pack2 = await validator.validate(pack);
    expect(pack2.name).toBe("bmob");
  });

  test("Should sanitize and remove things outside schema", async () => {
    @Schema()
    class User {
      @Is(a.string().max(10))
      name: string;
    }

    const container = new ContainerInstance(Math.random().toString());
    const validator = new ValidatorService(container);

    const result = await validator.cast(
      {
        name: "John",
        gender: "Male",
      },
      {
        strict: true,
        model: User,
        stripUnknown: true,
      }
    );

    expect(result.gender).toBeUndefined();
  });

  test("Should work with extended schemas properly", async () => {
    @Schema()
    class User {
      @Is(a.string())
      firstName: string;

      @Is(a.string().min(100))
      lastName: string;
    }

    @Schema()
    class SubUser extends User {
      @Is(a.string())
      lastName: string;
    }

    const container = new ContainerInstance(Math.random().toString());
    const validator = new ValidatorService(container);

    const yupObject = validator.getSchema(new SubUser());
    await expect(
      validator.validate(
        {
          firstName: "John",
          lastName: 123,
        },
        {
          model: SubUser,
          strict: true,
        }
      )
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      validator.validate(
        {
          firstName: 123,
          lastName: "John",
        },
        {
          model: SubUser,
          strict: true,
        }
      )
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      validator.validate(
        {
          firstName: "John",
          lastName: "Smith",
        },
        {
          model: SubUser,
          strict: true,
        }
      )
    ).resolves;
  });

  test("Should work with nested", async () => {
    @Schema()
    class Profile {
      @Is(a.string())
      firstName: string;

      @Is(a.string().min(3))
      lastName: string;
    }

    @Schema()
    class User {
      @Is(a.number())
      age: number;

      @Is(() => Schema.from(Profile))
      profile: Profile;

      @Is(() => an.array().of(Schema.from(Kid)))
      kids: Kid[];
    }

    @Schema()
    class Kid {
      @Is(a.string().required())
      name: string;
      @Is(a.number().required().min(5))
      age: number;
    }

    const container = new ContainerInstance(Math.random().toString());
    const validator = new ValidatorService(container);

    await expect(
      validator.validate(
        {
          age: 123,
          profile: {
            firstName: "John",
            lastName: "Smith",
          },
          kids: [
            { name: "John", age: 14 },
            { name: "Smith", age: 15 },
          ],
        },
        {
          model: User,
          strict: true,
        }
      )
    ).resolves;

    await expect(
      validator.validate(
        {
          age: 123,
          profile: {
            firstName: "John",
            lastName: "Smithens",
          },
        },
        {
          model: User,
          strict: true,
        }
      )
    ).resolves;

    await expect(
      validator.validate(
        {
          age: 123,
          profile: {
            firstName: "John",
            lastName: "Smith",
          },
          kids: [{ name: "John", age: 3 }],
        },
        {
          model: User,
          strict: true,
        }
      )
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
