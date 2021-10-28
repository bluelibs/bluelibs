import { Bundle } from "../models/Bundle";
import { assert } from "chai";
import { Kernel } from "../models/Kernel";
import { EventManager } from "../models/EventManager";
import { BundlePhase } from "../defs";

describe("Bundle", () => {
  it("Should work with a config and a default config", () => {
    class A extends Bundle {
      public defaultConfig = {
        number: 20,
      };
    }

    const a = new A({
      somethingElse: 10,
    });

    a.setup();

    assert.equal(a.getConfig().number, 20);
    assert.equal(a.getConfig().somethingElse, 10);

    a.setConfig({
      number: 30,
    });

    assert.equal(a.getConfig().number, 30);
    assert.equal(a.getConfig().somethingElse, undefined);

    a.updateConfig({
      somethingElse: false,
    });

    assert.equal(a.getConfig().number, 30);
    assert.equal(a.getConfig().somethingElse, false);
  });

  it("Should validate when set kernel", done => {
    const kernel = new Kernel();

    class A extends Bundle {
      async validate() {
        assert.equal(this.kernel, kernel);
        done();
      }
    }

    const a = new A();
    a.setKernel(kernel);
    a.setup();
  });

  it("Bundle container is accessible from kernel", async () => {
    const kernel = new Kernel();

    class A extends Bundle {}

    const a = new A();
    kernel.addBundle(a);
    await kernel.init();

    assert.strictEqual(a.container, kernel.container);
  });

  it("Ensure you cannot initialise a kernel with invalid configured bundles", async () => {
    const kernel = new Kernel();

    class A extends Bundle {
      async validate() {
        throw new Error("x");
      }
    }

    const a = new A();
    kernel.addBundle(a);

    try {
      await kernel.init();
      assert.isTrue(false);
    } catch (e) {
      assert.instanceOf(e, Error);
    }
  });

  it("Ensure a bundle can get other bundle", done => {
    const kernel = new Kernel();
    let aBundle;
    class ABundle extends Bundle {}
    class BBundle extends Bundle {
      async init() {
        if (aBundle !== this.get(ABundle)) {
          done(new Error());
        } else {
          done();
        }
      }
    }

    aBundle = new ABundle();
    const bBundle = new BBundle();

    kernel.addBundle(aBundle);
    kernel.addBundle(bBundle);

    kernel.init();
  });

  it("Shoult get access to the event manager", async () => {
    const kernel = new Kernel();

    class A extends Bundle {}

    const a = new A();
    kernel.addBundle(a);
    await kernel.init();

    assert.instanceOf(a.eventManager, EventManager);
  });

  it("Should work with dependencies", async () => {
    class A extends Bundle {}
    class B extends Bundle {
      dependencies = [A];
    }
    const kernel = new Kernel();

    kernel.addBundle(new A());
    kernel.addBundle(new B());

    await kernel.init();

    const kernel2 = new Kernel();
    kernel2.addBundle(new B());

    let inError = false;
    try {
      await kernel2.init();
    } catch (e) {
      inError = true;
    }

    assert.isTrue(inError);
  });

  it("should work with addDependency", async () => {
    class A extends Bundle {}
    class B extends Bundle {
      async extend() {
        await this.addDependency(A);
      }
    }

    const kernel = new Kernel();

    kernel.addBundle(new B());

    await kernel.init();

    assert.isTrue(kernel.hasBundle(A));
  });

  it("should properly handle bundle phases", async () => {
    const kernel = new Kernel();

    class A extends Bundle {}

    const a = new A();
    kernel.addBundle(a);
    assert.equal(a.getPhase(), BundlePhase.DORMANT);
    await kernel.init();
    let inError = false;

    try {
      a.setPhase(BundlePhase.PREPARED);
    } catch (e) {
      inError = true;
    }

    assert.isTrue(inError);
  });
});
