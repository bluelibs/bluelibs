import { Bundle } from "../models/Bundle";
import { assert } from "chai";
import { Kernel } from "../models/Kernel";
import { EventManager } from "../models/EventManager";
import { BundlePhase } from "../defs";
import { Inject, Service } from "../di";

describe("DI", () => {
  it("Should work without specifying @Service()", async () => {
    class DatabaseService {
      insertsUser(name: string) {
        return {
          id: 1,
          name,
        };
      }
    }

    @Service()
    class SecurityService {
      constructor(public readonly databaseService: DatabaseService) {}

      createUser(name: string) {}
    }

    class MySecurityService extends SecurityService {
      @Inject()
      mydb: DatabaseService;

      constructor(public readonly databaseService: DatabaseService) {
        super(databaseService);
      }
    }

    class AppBundle extends Bundle {
      async init() {}
    }

    const kernel = new Kernel({
      bundles: [new AppBundle()],
    });

    await kernel.init();

    const securityService = kernel.container.get(MySecurityService);
    expect(securityService.databaseService).toBeInstanceOf(DatabaseService);
    securityService.createUser("Hello");
  });

  it("Should work with transient services", async () => {
    @Service({
      transient: true,
    })
    class MyService {}

    const kernel = new Kernel({});

    await kernel.init();

    expect(
      kernel.container.get(MyService) === kernel.container.get(MyService)
    ).toBe(false);
  });

  it("Should work with transient services extending abstract classes", async () => {
    @Service({ transient: true })
    abstract class Base {
      say() {
        return "Hello world!";
      }
    }
    @Service({
      transient: true,
    })
    class MyService extends Base {}

    const kernel = new Kernel({});
    await kernel.init();

    expect(
      kernel.container.get(MyService) === kernel.container.get(MyService)
    ).toBe(false);
  });
});
