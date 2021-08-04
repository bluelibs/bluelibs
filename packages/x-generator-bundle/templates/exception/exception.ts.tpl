import { Exception } from "@bluelibs/core";

{{# if hasInterfaceDefined }}
export interface {{ interfaceDefinition.name }} {
{{ interfaceDefinition.toTypescript }}
}
{{/ if }}

export class {{ exceptionClass }} extends Exception<{{ exceptionInterfaceName }}> {
  getMessage() {
  // Note: you have access to this.data
  return `Exception {{ exceptionName }} has occured.`
  }
}