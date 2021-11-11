import { use, useContainer } from "@bluelibs/x-ui-react-bundle";
import { GUARDIAN_SMART_TOKEN } from "../../constants";

import { GuardianSmart } from "../smarts/GuardianSmart";

export const useGuardian = (): GuardianSmart => {
  const container = useContainer();

  const guardian = container.get(GUARDIAN_SMART_TOKEN);

  return use(guardian);
};
