import { assert } from "chai";
import astToQuery, { deny, getMaxDepth, astToBody, astQueryToInfo } from "../../core/graphql/astToQuery";
import gql from "graphql-tag";
import { log, getRandomCollection } from "../integration/helpers";
import { query, clear } from "../../core/api";
import { Collection } from "mongodb";
import { client } from "../connection";
import { SPECIAL_PARAM_FIELD } from "../../core/constants";
import { enforceMaxLimit } from "../../core/graphql/astToQuery";
import Query from "../../core/query/Query";

describe("GraphQL", function() {
  let A: Collection;
  let B: Collection;
  let C: Collection;
  let D: Collection;
  let E: Collection;

  beforeAll(async () => {
    A = await getRandomCollection("A");
    B = await getRandomCollection("B");
    C = await getRandomCollection("C");
    D = await getRandomCollection("D");
    E = await getRandomCollection("E");
  });

  // Cleans the collection and their defined links
  afterEach(async () => {
    await A.deleteMany({});
    await B.deleteMany({});
    await C.deleteMany({});
    await D.deleteMany({});
    await E.deleteMany({});

    [A, B, C, D, E].forEach((coll) => clear(coll));
  });

  it("#astToBody()", () => {
    const ast = gql`
      query {
        users(showAll: true) {
          a
          b
          profile(withPrefix: true) {
            a
          }
        }
      }
    `;

    const info = astQueryToInfo(ast);
    const body = astToBody(info);

    assert.isObject(body);
    assert.isObject(body.a);
    assert.isObject(body.b);
    assert.isObject(body.profile);
    assert.isUndefined(body.profile[SPECIAL_PARAM_FIELD]);
  });

  it("#astToQuery()", () => {
    const Users = A;

    const ast = gql`
      query {
        users(showAll: true) {
          a
          b
          profile(withPrefix: true) {
            a
            b
          }
        }
      }
    `;

    const info = astQueryToInfo(ast);

    const query = astToQuery(Users, info, {
      // We also check if intersection works and preserves the arguments
      intersect: {
        a: 1,
        profile: {
          a: 1,
        },
      },
      embody(body, getArguments) {
        const profileArguments = getArguments("profile");
        assert.equal(profileArguments.withPrefix, true);
      },
      sideBody: {
        a: 1,
      },
    });

    assert.instanceOf(query, Query);

    // console.log(query.body);
    assert.isUndefined(query.body.b);
    assert.isUndefined(query.body.profile.b);
  });

  it("#deny()", function() {
    const body = {
      test: 1,
      testDeny: 1,
      nested: {
        testDeny: 1,
        testAllow: 1,
      },
      nestedEmpty: {
        disallow: 1,
      },
      nestedDeny: {
        a: 1,
        b: 1,
        c: 1,
      },
      heavy: {
        nest: {
          ting: {
            wup: {
              denyThis: 1,
            },
          },
        },
      },
    };

    deny(body, ["testDeny", "nested.testDeny", "nestedEmpty.disallow", "nestedDeny", "heavy.nest.ting.wup.denyThis"]);

    assert.isDefined(body.test);
    assert.isUndefined(body.testDeny);
    assert.isDefined(body.nested.testAllow);
    assert.isUndefined(body.nested.testDeny);
    assert.isUndefined(body.nestedDeny);
    assert.isUndefined(body.heavy);
  });

  it("#getMaxDepth()", function() {
    let body: any = {
      a: 1,
      b: 2,
    };

    assert.equal(getMaxDepth(body), 1);

    body = {
      a: {
        b: 1,
      },
      b: 1,
    };

    assert.equal(getMaxDepth(body), 2);

    body = {
      a: {
        b: 1,
        c: {
          d: {
            a: 1,
          },
        },
      },
      b: 1,
      c: {
        a: 1,
      },
    };

    assert.equal(getMaxDepth(body), 4);

    body = {
      a: {
        b: {
          c: {
            d: {
              e: {
                a: 1,
              },
            },
          },
        },
      },
      b: {
        c: {
          d: {
            e: {
              a: 1,
            },
          },
        },
      },
    };

    assert.equal(getMaxDepth(body), 6);
  });

  it("#enforceMaxLimit()", function() {
    let props: any = {
      options: {
        limit: 5,
      },
    };

    enforceMaxLimit(props, 10);

    assert.equal(5, props.options.limit);

    props = {
      options: {
        limit: 11,
      },
    };

    enforceMaxLimit(props, 9);

    assert.equal(9, props.options.limit);

    props = {};
    enforceMaxLimit(props, 9);
    assert.equal(9, props.options.limit);

    props = {
      options: {},
    };
    enforceMaxLimit(props, 9);
    assert.equal(9, props.options.limit);
  });
});
