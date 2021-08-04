import * as React from "react";
import { UserRolesType } from "../../defs";

export type NotAuthorizedProps = {
  roles?: UserRolesType;
};

export function NotAuthorized(props: NotAuthorizedProps) {
  return (
    <div>
      <h1>You are not currently authorised to view this page</h1>
    </div>
  );
}
