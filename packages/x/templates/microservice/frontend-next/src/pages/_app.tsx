import "../styles/globals.css";

import { createApp } from "@bluelibs/x-ui-next";
import { kernel } from "../startup/kernel";

export default createApp({
  kernel,
});
