import "reflect-metadata";

import { XUIProvider } from "@bluelibs/x-ui";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { kernel } from "./kernel";
import "./styles.scss";

ReactDOM.render(
  <XUIProvider kernel={kernel} />,
  document.getElementById("root")
);
