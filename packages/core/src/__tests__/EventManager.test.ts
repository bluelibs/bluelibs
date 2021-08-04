import { assert, expect } from "chai";
import { Event, EventManager } from "../models/EventManager";
import { Listener, On } from "../models/Listener";
import { Kernel } from "../models/Kernel";
import { Bundle } from "../models/Bundle";
import { Service } from "typedi";

describe("EventManager", () => {
  it("should work properly", done => {
    const manager = new EventManager();
    class UserAddedEvent extends Event<{ userId: string }> {}

    manager.addListener(UserAddedEvent, (e: UserAddedEvent) => {
      assert.equal(e.name, "UserAddedEvent");
      done();
    });

    manager.emit(
      new UserAddedEvent({
        userId: "123",
      })
    );
  });

  it("should work properly", done => {
    const manager = new EventManager();
    class UserAddedEvent extends Event<{ userId: string }> {}

    manager.addListener(UserAddedEvent, (e: UserAddedEvent) => {
      assert.equal(e.name, "UserAddedEvent");
      done();
    });

    manager.emit(
      new UserAddedEvent({
        userId: "123",
      })
    );
  });

  it("should work removing listeners", done => {
    const manager = new EventManager();
    class UserAddedEvent extends Event<{ userId: string }> {}

    const listener = () => {
      done(`Should not be here`);
    };

    // Just to check if it works without having it added?
    manager.removeListener(UserAddedEvent, listener);
    manager.addListener(UserAddedEvent, listener);
    manager.removeListener(UserAddedEvent, listener);

    manager.emit(
      new UserAddedEvent({
        userId: "123",
      })
    );

    done();
  });

  it("should work prioritising listeners", done => {
    const manager = new EventManager();
    class UserAddedEvent extends Event<{ userId: string }> {}

    let inNonPriorityOne = false;
    const listener = () => {
      inNonPriorityOne = true;
    };

    manager.addListener(UserAddedEvent, listener);
    manager.addListener(
      UserAddedEvent,
      () => {
        if (inNonPriorityOne) {
          done(new Error());
        } else {
          done();
        }
      },
      { order: -1 }
    );

    manager.emit(
      new UserAddedEvent({
        userId: "123",
      })
    );
  });

  it("should validate", async () => {
    const manager = new EventManager();
    class UserAddedEvent extends Event<{ userId: string }> {
      async validate() {
        if (this.data.userId === "bro") {
          throw new Error("wheres the user bro?");
        }
      }
    }

    manager.addListener(UserAddedEvent, (e: UserAddedEvent) => {});

    expect(
      manager.emit(
        new UserAddedEvent({
          userId: "bro",
        })
      )
    ).to.eventually.be.rejected;
  });

  it("should work with global events handlers", done => {
    const manager = new EventManager();
    class UserAddedEvent extends Event<{ userId: string }> {}

    manager.addGlobalListener(e => {
      done();
    });

    manager.emit(
      new UserAddedEvent({
        userId: "123",
      })
    );
  });

  it("should work removing global listeners", done => {
    const manager = new EventManager();
    class UserAddedEvent extends Event<{ userId: string }> {}

    const listener = e => {
      done("error");
    };
    manager.addGlobalListener(listener);
    manager.removeGlobalListener(listener);

    manager.emit(
      new UserAddedEvent({
        userId: "123",
      })
    );

    done();
  });

  it("should work instantiating bundle servces", done => {
    class InvoicePaid extends Event<null> {}

    @Service()
    class InvoiceListener extends Listener {
      init() {
        assert.instanceOf(this.get(EventManager), EventManager);
        this.on(InvoicePaid, () => done());
      }
    }

    class InvoiceBundle extends Bundle {
      async init() {
        this.warmup([InvoiceListener]);
      }
    }

    const kernel = new Kernel({
      bundles: [new InvoiceBundle()],
    });

    kernel.init().then(() => {
      kernel.container.get(EventManager).emit(new InvoicePaid());
    });
  });

  it("should work with @On decorator", done => {
    class InvoicePaid extends Event<null> {}
    @Service()
    class InvoiceListener extends Listener {
      @On(InvoicePaid)
      async onInvoicePaid(event: InvoicePaid) {
        done();
      }
    }

    class InvoiceBundle extends Bundle {
      async init() {
        this.warmup([InvoiceListener]);
      }
    }

    const kernel = new Kernel({
      bundles: [new InvoiceBundle()],
    });

    kernel.init().then(() => {
      kernel.container.get(EventManager).emit(new InvoicePaid());
    });
  });
});
