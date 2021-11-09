<<<<<<< HEAD
import { Bundle } from "@bluelibs/core";
import { XUIGuardianBundle } from "@bluelibs/x-ui-guardian-bundle";
import { XUIReactBundle } from "@bluelibs/x-ui-react-bundle";
import { IXUINextBundleType } from "./defs";
import { XNextRouter } from "./react";

export class XUINextBundle extends Bundle<IXUINextBundleType> {
  async extend() {
    await this.addDependency(XUIGuardianBundle);
    await this.addDependency(XUIReactBundle);
  }

  async prepare() {
    this.container.set(XNextRouter, new XNextRouter());
=======
import { Bundle, KernelPhase } from "@bluelibs/core";
import {
  GuardianSmart,
  XUIGuardianBundle,
  XUIGuardianProvider,
} from "@bluelibs/x-ui-guardian-bundle";
import { IComponents, XUIReactBundle } from "@bluelibs/x-ui-react-bundle";
import { IXUINextBundleConfigType } from "./defs";

import {
  ApolloClient,
  ApolloProvider,
  UIApolloBundle,
} from "@bluelibs/ui-apollo-bundle";
import { UISessionBundle } from "@bluelibs/ui-session-bundle";
import { XUICollectionsBundle } from "@bluelibs/x-ui-collections-bundle";

export class XUINextBundle extends Bundle<IXUINextBundleConfigType> {
  protected defaultConfig = {
    apollo: {},
    guardian: {},
    react: {},
    sessions: {},
  } as IXUINextBundleConfigType;

  async extend() {
    const config = this.config;

    await this.addDependency(UIApolloBundle, config.apollo);

    await this.addDependency(XUIGuardianBundle, config.guardian);

    await this.addDependency(XUIReactBundle, config.react);

    await this.addDependency(UISessionBundle, config.sessions);

    await this.addDependency(XUICollectionsBundle);
  }

  async prepare() {
    const xuiReactBundle = this.container.get(XUIReactBundle);

    xuiReactBundle.addWrappers([
      {
        component: ApolloProvider,
        props: () => ({
          client: this.container.get(ApolloClient),
        }),
        order: 10,
      },
      // FIXME: find a way to pass him an `initialisingComponent`, if needed?
      {
        component: XUIGuardianProvider,
        order: 20,
      },
    ]);
  }

  /**
   * You can set the guardian before it has been prepared
   * @param guardianClass
   */
  setGuardianClass(guardianClass: { new (): GuardianSmart }) {
    const phase = this.kernel.getPhase();
    if ([KernelPhase.PREPARING, KernelPhase.INITIALISING].includes(phase)) {
      this.config.guardian.guardianClass = guardianClass;
    } else {
      throw new Error(
        `You cannot set the guardian at this stage, do it before the bundle is initialised.`
      );
    }
  }

  /**
   * Use this in the prepare or init phase to update certain UI Components
   * @param components
   */
  updateComponents(components: Partial<IComponents>) {
    const xuiReactBundle = this.container.get(XUIReactBundle);

    xuiReactBundle.updateComponents(components);
>>>>>>> 2027a85 ((feat) x-next-boilerplate)
  }
}
