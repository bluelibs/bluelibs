import { useGuardian, useRouter } from "@bluelibs/x-ui";
import { useEffect } from "react";
import { notification } from "antd";
import { Routes } from "@bundles/UIAppBundle";

export function SocialAuth(props: { queryVariables?: { token?: string } }) {
  const guardian = useGuardian();
  const router = useRouter();
  useEffect(() => {
    const token = props.queryVariables?.token;
    guardian
      .storeToken(token)
      .then(() => {
        notification.success({
          message: "Welcome!",
        });
        router.go(Routes.HOME);
      })
      .catch((err) => {
        notification.success({
          message: "Something went wrong!",
        });
        router.go(Routes.LOGIN);
      });
  }, []);

  return <></>;
}
