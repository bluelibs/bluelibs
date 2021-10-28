import { Bundle, KernelPhase } from "@bluelibs/core";
import { setDefaults } from "@bluelibs/smart";
import {
  ApolloClient,
  ApolloProvider,
  UIApolloBundle,
} from "@bluelibs/ui-apollo-bundle";
import {
  I18NConfig,
  I18NService,
  UII18NBundle,
<<<<<<< HEAD
} from "@bluelibs/x-ui-i18n-bundle";
import { UISessionBundle } from "@bluelibs/x-ui-session-bundle";
=======
} from "@bluelibs/ui-i18n-bundle";
import { UISessionBundle } from "@bluelibs/ui-session-bundle";
>>>>>>> 047d18a ((initial changes))
import {
  GuardianSmart,
  XUIGuardianBundle,
  XUIGuardianProvider,
} from "@bluelibs/x-ui-guardian-bundle";
<<<<<<< HEAD
import { Components, XUIReactBundle } from "@bluelibs/x-ui-react-bundle";
import { IComponents } from "./overrides";
=======
import {
  Components,
  IComponents,
  XUIReactBundle,
} from "@bluelibs/x-ui-react-bundle";
>>>>>>> 047d18a ((initial changes))
import {
  XBrowserRouter,
  XRouter,
  XUIReactRouterBundle,
} from "@bluelibs/x-ui-react-router-bundle";
import { XUICollectionsBundle } from "@bluelibs/x-ui-collections-bundle";
import { XUIBundleConfigType } from "./defs";

export class XUIBundle extends Bundle<XUIBundleConfigType> {
  protected defaultConfig = {
    apollo: {},
    guardian: {},
    i18n: {},
    react: {},
    sessions: {},
  } as XUIBundleConfigType;

  async extend() {
    const config = this.config;

    // TODO: cleanup after deprecation
    await this.addDependency(
      UIApolloBundle,
      (config.graphql && {
        client: config.graphql,
        enableSubscriptions: config.enableSubscriptions,
      }) ||
        this.config.apollo
    );

    await this.addDependency(
      XUIGuardianBundle,
      (config.guardianClass && {
        guardianClass: config.guardianClass,
      }) ||
        config.guardian
    );

    await this.addDependency(XUIReactBundle, config.react);

    await this.addDependency(UISessionBundle, config.sessions);

    await this.addDependency(UII18NBundle, config.i18n);
<<<<<<< HEAD

    await this.addDependency(XUIReactRouterBundle);

=======

    await this.addDependency(XUIReactRouterBundle);

>>>>>>> 047d18a ((initial changes))
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
<<<<<<< HEAD
      },
      // FIXME: find a way to pass him an `initialisingComponent`, if needed?
      {
        component: XUIGuardianProvider,
        order: 20,
      },
=======
      },
      // FIXME: find a way to pass him an `initialisingComponent`, if needed?
      {
        component: XUIGuardianProvider,
        order: 20,
      },
>>>>>>> 047d18a ((initial changes))
      {
        component: XBrowserRouter,
        props: () => ({
          router: this.container.get(XRouter),
        }),
        order: Infinity,
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

  /**
   * Store one or multiple i18n configurations
   * @param i18n
   */
  storeI18N(i18n: I18NConfig | I18NConfig[]) {
    this.container.get(I18NService).store(i18n);
  }
}
