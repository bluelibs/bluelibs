import { Collection, CollectionLinkConfig, CollectionTransformMap } from "@bluelibs/x-ui";
import { {{ entityName }} } from "@root/api.types";
{{# if hasFiles }}
import { AppFilesCollection, AppFileGroupsCollection } from "@bluelibs/x-ui-admin";
{{/ if }}
import {
  {{# each collectionClassNamesOfInterestExcludingMyself }}
    {{ this }},
  {{/ each }}
} from "@bundles/{{ bundleName }}/collections";
import { ObjectId } from "@bluelibs/ejson";

export type { {{ entityName }} };

export class {{ collectionName }}Collection extends Collection<{{ entityName }}> {
  getName() {
    return "{{ collectionEndpoint }}";
  }

  {{# if hasCustomInputs }}
    getInputs() {
      return {
        insert: "{{ entityName }}InsertInput!",
        update: "{{ entityName }}UpdateInput!",
      }
    }
  {{/ if }}

  // Return here the relations with other configs
  getLinks(): CollectionLinkConfig<{{ entityName }}>[] {
    return [
      {{# each links }}
        {
          collection: () => {{ collectionClass }},
          name: "{{ name }}",
          {{# if many }}
            many: true,
          {{/ if }}
          {{# if field }}
            field: "{{ field }}",
          {{/ if }}
        },
      {{/ each }}
    ]
  }

  // Return here how you want to transform certain fields
  getTransformMap(): CollectionTransformMap<{{ entityName }}> {
    return {
      {{# each dateFields }}
        {{this}}: (v) => new Date(v),
      {{/ each }}
    }
  }
}
