import { Bundle } from "../models/Bundle";
import { assert, expect } from "chai";
import { Kernel } from "../models/Kernel";
import { KernelContext, KernelPhase } from "../defs";

describe("Kernel", () => {
  it("Should be instantiable with bundles, parameters, and can addBundles", async () => {
    class A extends Bundle {}
    class B extends Bundle {}

    const kernel = new Kernel({
      bundles: [new A()],
      parameters: {
        config: "100",
      },
    });

    kernel.addBundle(new B());

    assert.isTrue(kernel.getPhase() === KernelPhase.DORMANT);

    await kernel.init();

    assert.isTrue(kernel.hasBundle(B));
    assert.isNotNull(kernel.get(B));
    assert.isNotNull(kernel.get(A));

    assert.isTrue(kernel.parameters.config === "100");

    assert.equal(kernel.getPhase(), KernelPhase.INITIALISED);
  });

  it("It should work to add more bundles at once", async () => {
    class A extends Bundle {}
    class B extends Bundle {}

    const kernel = new Kernel({});

    kernel.addBundles([new B(), new A()]);

    await kernel.init();

    assert.isTrue(kernel.hasBundle(B));
    assert.isNotNull(kernel.get(B));
    assert.isNotNull(kernel.get(A));
  });

  it("Should not allow me to add a bundle after it was initialised", async () => {
    const kernel = new Kernel();
    class B extends Bundle {}

    await kernel.init();

    expect(() => {
      kernel.addBundle(new B());
    }).to.throw();
  });

  it("Should not allow me to add the same bundle twice", async () => {
    const kernel = new Kernel();
    class B extends Bundle {}
    kernel.addBundle(new B());
    expect(() => {
      kernel.addBundle(new B());
    }).to.throw();

    await kernel.init();
  });

  it("Should shutdown", async () => {
    const kernel = new Kernel();
    let inShutdown = false;
    class B extends Bundle {
      async shutdown() {
        inShutdown = true;
      }
    }
    kernel.addBundle(new B());

    await kernel.init();
    await kernel.shutdown();
    assert.isTrue(inShutdown);
    assert.equal(kernel.getPhase(), KernelPhase.SHUTDOWN);
  });

  it("Should properly use the helper methods", () => {
    const kernel1 = new Kernel({
      parameters: {
        context: KernelContext.PRODUCTION,
      },
    });
    assert.isTrue(kernel1.isProduction());
    assert.isFalse(kernel1.isDebug());
    assert.isFalse(kernel1.isDevelopment());

    const kernel2 = new Kernel({
      parameters: {
        context: KernelContext.DEVELOPMENT,
        debug: true,
        testing: true,
      },
    });
    assert.isTrue(kernel2.isDevelopment());
    assert.isTrue(kernel2.isTesting());
    assert.isTrue(kernel2.isDebug());
    assert.isFalse(kernel2.isProduction());
  });
});
