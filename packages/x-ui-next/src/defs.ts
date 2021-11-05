<<<<<<< HEAD
export type IXUINextBundleType = {};
=======
import { IUIApolloBundleConfig } from "@bluelibs/ui-apollo-bundle";
import { IXUIGuardianBundleConfigType } from "@bluelibs/x-ui-guardian-bundle";
import { IUISessionBundleConfigType } from "@bluelibs/ui-session-bundle";
import { IXUIReactBundleConfigType } from "@bluelibs/x-ui-react-bundle";

export type IXUINextBundleConfigType = Partial<{
  apollo: IUIApolloBundleConfig;
  guardian: IXUIGuardianBundleConfigType;
  sessions: IUISessionBundleConfigType;
  react: IXUIReactBundleConfigType;
}>;
>>>>>>> 2027a85 ((feat) x-next-boilerplate)
