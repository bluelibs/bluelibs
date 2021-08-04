#!/usr/bin/env node

// CLITS
import { Kernel } from "@bluelibs/core";
import { TerminalBundle } from "@bluelibs/terminal-bundle";
import { XGeneratorBundle } from "./XGeneratorBundle";

const kernel = new Kernel({
  bundles: [
    new TerminalBundle({
      version: require("../package.json").version,
    }),
    new XGeneratorBundle(),
  ],
});

kernel.init().then(() => {
  // exec('npm view @bluelibs/x version').
});
