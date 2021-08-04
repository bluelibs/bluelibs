import { HasherService } from "../../services/HasherService";
import { assert } from "chai";

describe("HasherService", () => {
  it("Should generate random salt", () => {
    const service = new HasherService();

    const str = service.generateSalt();
    assert.isString(str);

    assert.notEqual(str, service.generateSalt());
  });

  it("Should work generating a token (for reset pw and email)", () => {
    const service = new HasherService();
    const str = service.generateToken();
    assert.isString(str);

    assert.notEqual(str, service.generateToken());
  });

  it("should hash properly the password via using or non-usign salt", () => {
    const service = new HasherService();
    const PW = "12345";
    const SALT = "123";

    assert.equal(service.getHashedPassword(PW), service.getHashedPassword(PW));
    assert.notEqual(
      service.getHashedPassword(PW),
      service.getHashedPassword(PW, SALT)
    );
    assert.equal(
      service.getHashedPassword(PW, SALT),
      service.getHashedPassword(PW, SALT)
    );
  });
});
