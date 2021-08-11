import { Token } from "@bluelibs/core";
import { XUIBundleConfigType } from "./defs";
import { IComponents } from "./react/components/types";

export const XUI_CONFIG_TOKEN = new Token<XUIBundleConfigType>("XUI_CONFIG");
export const XUI_COMPONENTS_TOKEN = new Token<IComponents>("XUI_COMPONENTS");
export const APOLLO_CLIENT_OPTIONS_TOKEN = new Token("APOLLO_CLIENT_OPTIONS");
export const LOCAL_STORAGE_TOKEN_KEY = "bluelibs-token";
