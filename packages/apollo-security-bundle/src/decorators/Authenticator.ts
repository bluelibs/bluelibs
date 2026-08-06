import { Service } from "@bluelibs/core";

/**
 * Class decorator that registers an authenticator as a DI service.
 *
 * Typed as `ClassDecorator` so it can decorate abstract authenticator classes.
 * The `Service` decorator from `@bluelibs/core` types its target as a concrete
 * constructor, which rejects abstract classes with "Unable to resolve signature
 * of class decorator when called as an expression" (TS1238). This wrapper
 * restores the old published `ClassDecorator`-compatible signature.
 */
export function Authenticator(): ClassDecorator {
  return (target) => {
    // why: `Service`'s public target type only accepts concrete constructors,
    // but at runtime it accepts any constructor, including abstract ones.
    Service()(target as any);
  };
}
