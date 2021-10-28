import { use } from "@bluelibs/x-ui-react-bundle";
import { UISessionService } from "..";

export const useUISession = () => {
  return use(UISessionService);
};
