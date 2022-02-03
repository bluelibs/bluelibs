import { EJSON } from "@bluelibs/ejson";
import { cleanTypename } from "../../graphql/utils/cleanTypename";
import { richResponse, richResponseBody } from "../samples/richResponse";

describe("cleanTypename()", () => {
  test("should work with large deep set", () => {
    const data = EJSON.clone(richResponse);

    cleanTypename(data, richResponseBody);
    let filtered: any[] = data.map((d) =>
      d.attachments.files?.map((f) => f.thumbs)
    );
    filtered = filtered.flat(5).map((f) => f.path);

    expect(filtered[0] == filtered[1]).toBe(false);
    expect(filtered).toHaveLength(3);
  });
});
