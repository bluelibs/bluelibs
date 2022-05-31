import { {{ entityName }} } from "@root/api.types";
import { UiCrudSecurity } from "@bluelibs/x-ui-admin";

export const {{ entityName }}SecurityConfig : UiCrudSecurity<{{ entityName }}> | any = {{{ uiCrudSheildJSON }}}
