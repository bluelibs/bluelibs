import { Bundle, KernelPhase } from "@bluelibs/core";
import {
  GuardianSmart,
  XUIGuardianBundle,
  XUIGuardianProvider,
} from "@bluelibs/x-ui-guardian-bundle";
import { IComponents, XUIReactBundle } from "@bluelibs/x-ui-react-bundle";
import { XUINextBundleConfigType } from "./defs";

import {
  ApolloClient,
  ApolloProvider,
  UIApolloBundle,
} from "@bluelibs/ui-apollo-bundle";
import { XUISessionBundle } from "@bluelibs/x-ui-session-bundle";
import { XUII18NBundle } from "@bluelibs/x-ui-i18n-bundle";
import { XUICollectionsBundle } from "@bluelibs/x-ui-collections-bundle";

export class XUINextBundle extends Bundle<XUINextBundleConfigType> {
  protected defaultConfig = {
    apollo: {},
    guardian: {},
    react: {},
    sessions: {},
    i18n: {},
  } as XUINextBundleConfigType;

  async extend() {
    const config = this.config;

    await this.addDependency(UIApolloBundle, config.apollo);
    await this.addDependency(XUIGuardianBundle, config.guardian);
    await this.addDependency(XUIReactBundle, config.react);
    await this.addDependency(XUISessionBundle, config.sessions);
    await this.addDependency(XUII18NBundle, config.i18n);
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
  }
}
