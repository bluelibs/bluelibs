{{ importTestableElement }}

// Jest Setup & Teardown: https://jestjs.io/docs/en/setup-teardown
// API: https://jestjs.io/docs/en/api
// Expect: https://jestjs.io/docs/en/expect

describe("{{ testItem }}", () => {
  {{# each methodsArray }}
    test("{{ this }}()", () => {
      throw new Error("Test not implemented.");
    })
  {{/ each }}
})
