import { UserRolesType, useUIComponents } from "@bluelibs/x-ui-react-bundle";
import * as React from "react";
import { useGuardian } from "../hooks";

// `P` defaults to `any` because the wrapped component's props are consumer-defined
// and unknown to Protect; callers may specialise `ProtectProps<MyComponentProps>`.
export type ProtectProps<P = any> = {
  /**
   * If you don't specify any roles it will ensure that the user is logged in.
   */
  roles?: UserRolesType;
  component?: React.ComponentType<P>;
  componentProps?: P;
  children?: React.ReactNode;
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
