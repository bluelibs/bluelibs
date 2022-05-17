import { {{ modelClass }} } from "./{{ modelClass }}.model";
import { Studio } from "@bluelibs/x";

export const {{ modelClass }}SecurityConfig : Studio.SecuritySchematic<{{ modelClass }}> = {{{ securityConfig }}}
