import { IUII18NBundleConfig } from "@bluelibs/x-ui-i18n-bundle";
import { IXUISessionBundleConfigType } from "@bluelibs/x-ui-session-bundle";
import {
  GuardianSmart,
  IXUIGuardianBundleConfigType,
} from "@bluelibs/x-ui-guardian-bundle";
import { IXUIReactBundleConfigType } from "@bluelibs/x-ui-react-bundle";
import {
  ApolloClientOptions,
  IUIApolloBundleConfig,
} from "@bluelibs/ui-apollo-bundle";
import { Constructor } from "@bluelibs/core";

export type XUIBundleConfigType = Partial<{
  /**
   * @deprecated Please use `apollo.client`
   */
  graphql: Partial<ApolloClientOptions<any>>;

  /**
   * @deprecated Please use `guardian.guardianClass`
   */
  guardianClass: Constructor<GuardianSmart>;

  /**
   * @deprecated Please use `apollo.enableSubscriptions`
   */
  enableSubscriptions: boolean;

  apollo: IUIApolloBundleConfig;
  guardian: IXUIGuardianBundleConfigType;
  sessions: IXUISessionBundleConfigType;
  react: IXUIReactBundleConfigType;
  i18n: IUII18NBundleConfig;
}>;
