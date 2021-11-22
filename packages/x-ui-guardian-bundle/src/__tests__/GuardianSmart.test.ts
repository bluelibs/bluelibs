import { GuardianSmart, GuardianUserType } from "..";
import { ObjectId } from "@bluelibs/ejson";

describe("GuardianSmart", () => {
  test("userId should be objectId", async () => {
    const guardianSmart = new GuardianSmart();

    const retrieveUserResponse = {
      _id: "a".repeat(24),
    } as GuardianUserType;

    const user = guardianSmart.transformUser(retrieveUserResponse);

    expect(user._id).toBeInstanceOf(ObjectId);
  });
});
