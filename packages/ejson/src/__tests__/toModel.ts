import { toModel } from "../toModel";

class Person {
  firstName: string;
  lastName: string;
  gender: string = "male";
}

describe("toModel", () => {
  test("default option", () => {
    const person = toModel(Person, {
      firstName: "string",
    });

    expect(person).toBeInstanceOf(Person);
    expect(person.gender).toBe("male");
    expect(person.lastName).toBeUndefined();
  });

  test("partial option enabled", () => {
    const person = toModel(
      Person,
      {
        firstName: "string",
      },
      {
        partial: true,
      }
    );

    expect(person).toBeInstanceOf(Person);
    expect(person.gender).toBeUndefined();
    expect(person.lastName).toBeUndefined();
  });
});
