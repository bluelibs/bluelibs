import { XUI_COMPONENTS_TOKEN } from "../../constants";
import { IComponents } from "../components/types";
import { use } from "./use";

export function useUIComponents(): IComponents {
  return use(XUI_COMPONENTS_TOKEN);
}
