import * as React from "react";
import { Button } from "antd";
import { useGuardian, useRouter } from "@bluelibs/x-ui";

export function AdminTopHeader() {
  const guardian = useGuardian();
  const router = useRouter();
  const user = guardian.state.user;

  if (!user) {
    return null;
  }

  return (
    <Button
      onClick={() => guardian.logout().then(() => router.go({ path: "/" }))}
    >
      Logout
    </Button>
  );
}
