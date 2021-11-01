import * as React from "react";
import { createElement } from "react";
import { use, newSmart } from "@bluelibs/x-ui-react-bundle";
import { GUARDIAN_SMART_TOKEN } from "../../constants";
import { IXUIGuardianProviderProps } from "../../defs";

export const XUIGuardianProvider: React.FC<IXUIGuardianProviderProps> = (
  props
) => {
  const guardianSmart = use(GUARDIAN_SMART_TOKEN);
  const [guardian, GuardianProvider] = newSmart(guardianSmart);
  if (!guardian.state.initialised) {
    // We want to prevent re-renders at page/route level due to guardian
    // Not doing so, it may imply a re-render almost 4 times on every page load
    return props.loadingComponent
      ? createElement(props.loadingComponent)
      : null;
  }

  return <GuardianProvider>{props.children}</GuardianProvider>;
};
