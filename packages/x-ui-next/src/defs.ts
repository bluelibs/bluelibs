import { IXUII18NBundleConfig } from "@bluelibs/x-ui-i18n-bundle";
import { IXUISessionBundleConfigType } from "@bluelibs/x-ui-session-bundle";
import { IXUIGuardianBundleConfigType } from "@bluelibs/x-ui-guardian-bundle";
import { IUIApolloBundleConfig } from "@bluelibs/ui-apollo-bundle";
import { IXUIReactBundleConfigType } from "@bluelibs/x-ui-react-bundle";
import { Kernel } from "@bluelibs/core";

export type XUINextBundleConfigType = {
  apollo: IUIApolloBundleConfig;
  guardian: IXUIGuardianBundleConfigType;
  sessions: IXUISessionBundleConfigType;
  react: IXUIReactBundleConfigType;
  i18n: IXUII18NBundleConfig;
};

export interface CreateAppProps {
  loadingComponent?: JSX.Element;
  kernel: Kernel;
}
