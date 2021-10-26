import { assert } from "chai";
import intersectBody from "../../core/graphql/intersectBody";

describe("intersectDeep()", () => {
  it("should work with simple fields and non-collision nested fields", () => {
    const requestBody = {
      firstName: 1,
      profile: {
        services: 1,
      },
    };

    const bodyToIntersect = {
      firstName: 1,
      lastName: 1,
      profile: {
        score: 1,
      },
    };

    const result: any = intersectBody(requestBody, bodyToIntersect);

    assert.isDefined(result.firstName);
    assert.isUndefined(result.lastName);
    assert.isUndefined(result.profile);
  });

  it("should work with allowing the request body nesting", () => {
    const requestBody = {
      profile: {
        services: {
          email: 1,
        },
      },
    };

    const bodyToIntersect = {
      profile: {
        services: {},
      },
    };

    const result: any = intersectBody(requestBody, bodyToIntersect);

    assert.isObject(result.profile);
    assert.isObject(result.profile.services);
    assert.isNumber(result.profile.services.email);
  });

  it("should work with fields as objects", () => {
    const requestBody = {
      firstName: {},
    };

    const bodyToIntersect = {
      firstName: {},
    };

    const result: any = intersectBody(requestBody, bodyToIntersect);

    assert.isDefined(result.firstName);
  });
});
