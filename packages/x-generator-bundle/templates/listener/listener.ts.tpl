import { Listener, On } from "@bluelibs/core";
{{# if collectionEvents }}
{{ collectionImportLine }}
import {
  {{# each collectionEventNames }}
    {{ this }},
  {{/ each }}
} from "@bluelibs/mongo-bundle"
{{/ if }}

export class {{ listenerClass }} extends Listener {
  {{# if collectionEvents }}
    {{# each collectionEventNames }}
      @On({{ this }}, { filter: e => e.data.collection instanceof {{ @root.collectionClassName }} })
      on{{ this }}(e: {{ this }}) {
        throw new Error("Not implemented, yet.")
      }
    {{/ each }}
  {{ else }}
  // @On(MyEvent, {})
  // onMyEvent(e: MyEvent) {
  //   throw new Error("Not implemented, yet.")
  // }
  {{/ if }}
}