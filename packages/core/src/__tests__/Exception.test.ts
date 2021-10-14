import { Bundle } from "../models/Bundle";
import { assert } from "chai";
import { Kernel } from "../models/Kernel";
import { EventManager } from "../models/EventManager";
import { BundlePhase } from "../defs";
import { Exception } from "../models/Exception";

describe("Exception", () => {
  it("Should work", () => {
    const context = {
      worksFine: true,
    };
    class MyException extends Exception {
      static code = "BS1040";

      getMessage() {
        return "ok";
      }

      getContext() {
        return context;
      }
    }

    try {
      throw new MyException();
    } catch (e) {
      assert.instanceOf(e, MyException);
      assert.instanceOf(e, Error);
      if (e instanceof MyException) {
        assert.equal(e.getCode(), "BS1040");
        assert.equal(e.getMessage(), "ok");
        assert.equal(e.message, "(BS1040) ok");
        assert.strictEqual(e.getContext(), context);
      }
    }
  });

  it("Should have a default msg", () => {
    class MyException extends Exception {}
    try {
      throw new MyException();
    } catch (e) {
      assert.instanceOf(e, MyException);
      if (e instanceof MyException) {
        assert.equal(e.getMessage(), "An error has occured");
      }
    }
  });
});
