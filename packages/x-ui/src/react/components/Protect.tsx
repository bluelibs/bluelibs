import * as React from "react";
import { useGuardian } from "../hooks";
import { useUIComponents } from "../hooks/useUIComponents";
import { UserRolesType } from "../../defs";

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
  const { roles, ...restProps } = props;
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
    if (props.children) {
      return props.children;
    }
    return React.createElement(props.component, props.componentProps);
  } else {
    return <UIComponents.NotAuthorized roles={props.roles} />;
  }
}
