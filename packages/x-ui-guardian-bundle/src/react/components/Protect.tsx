import { UserRolesType, useUIComponents } from "@bluelibs/x-ui-react-bundle";
import * as React from "react";
import { useGuardian } from "../hooks";

export type ProtectProps = {
  /**
   * If you don't specify any roles it will ensure that the user is logged in.
   */
  roles?: UserRolesType;
  component?: React.ComponentType<any>;
  componentProps?: AnyProps;
  children?: any;
};

type AnyProps = {
  [key: string]: any;
};

export function Protect(props: ProtectProps) {
  const { roles, component, componentProps, children } = props;
  const guardian = useGuardian();
  const UIComponents = useUIComponents();

  if (!guardian.state.initialised || guardian.state.fetchingUserData) {
    return <UIComponents.Loading />;
  }

  let shouldRender = true;
  if (roles !== "anonymous") {
    shouldRender = roles ? guardian.hasRole(roles) : guardian.state.isLoggedIn;
  }

  if (shouldRender) {
    if (children) {
      return children;
    }
    return React.createElement(component!, componentProps);
  } else {
    return <UIComponents.NotAuthorized roles={roles} />;
  }
}
