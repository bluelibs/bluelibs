import { IUII18NBundleConfig } from "@bluelibs/x-ui-i18n-bundle";
import { IXUISessionBundleConfigType } from "@bluelibs/x-ui-session-bundle";
import { IXUIGuardianBundleConfigType } from "@bluelibs/x-ui-guardian-bundle";
import { IUIApolloBundleConfig } from "@bluelibs/ui-apollo-bundle";
import { IXUIReactBundleConfigType } from "@bluelibs/x-ui-react-bundle";

export type XUINextBundleConfigType = {
  apollo: IUIApolloBundleConfig;
  guardian: IXUIGuardianBundleConfigType;
  sessions: IXUISessionBundleConfigType;
  react: IXUIReactBundleConfigType;
  i18n: IUII18NBundleConfig;
};
