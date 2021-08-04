import { ApolloBundle } from "@bluelibs/apollo-bundle";
import { Constructor, Service, ContainerInstance } from "@bluelibs/core";
import * as passport from "passport";
import { PassportAuthenticator } from "../models/PassportAuthenticator";

@Service()
export class PassportService {
  protected strategies: PassportAuthenticator[] = [];

  constructor(
    protected readonly apolloBundle: ApolloBundle,
    protected readonly container: ContainerInstance
  ) {}

  async init() {
    passport.serializeUser((user, fn) => {
      fn(null, user);
    });

    passport.deserializeUser((user: any, fn) => {
      fn(null, user);
    });

    this.apolloBundle.app.use(passport.initialize());
  }

  register(
    passportStrategiesClasses:
      | Constructor<PassportAuthenticator>
      | Constructor<PassportAuthenticator>[]
  ) {
    if (!Array.isArray(passportStrategiesClasses)) {
      passportStrategiesClasses = [passportStrategiesClasses];
    }

    passportStrategiesClasses.forEach((passportStrategiesClass) => {
      const instance = this.container.get<PassportAuthenticator>(
        passportStrategiesClass
      );

      this.strategies.forEach((strategy) => {
        if (strategy.name === instance.name) {
          throw new Error(`You cannot have two strategies with the `);
        }
      });

      this.strategies.push(instance);
      passport.use(instance.strategy);
      instance.route();
    });
  }
}
