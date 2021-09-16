import { Collection, Behaviors } from "@bluelibs/mongo-bundle";
{{# if hasSubscriptions }}
import { Behaviors as XBehaviors } from "@bluelibs/x-bundle";
{{/ if }}
import * as links from './{{ collectionNameUpper }}.links';
import * as reducers from './{{ collectionNameUpper }}.reducers';
import { {{ collectionModelClass }} } from "./{{ collectionModelClass }}.model";
{{# if customCollectionImport }}
import { {{ customCollectionName }} as BaseCollection } from "{{ customCollectionImport }}";
{{/ if }}

{{# if customCollectionImport }}
  export class {{ collectionClass }} extends BaseCollection<{{ collectionModelClass }}> {
{{ else }}
  export class {{ collectionClass }} extends Collection<{{ collectionModelClass }}> {
{{/ if }}
  static collectionName = "{{ collectionNameMongo }}"
  static model = {{ collectionModelClass }}

  static links = links;
  static reducers = reducers;

  {{# if containsBehaviors }}
  static behaviors = [
    {{# if isTimestampable }}
    Behaviors.Timestampable(),
    {{/ if }}

    {{# if isBlameable }}
    Behaviors.Blameable(),
    {{/ if }}

    {{# if isSoftdeletable }}
    Behaviors.Softdeletable(),
    {{/ if }}

    {{# if validationModel }}
    Behaviors.Validate({ model: {{ collectionModelClass }} }),
    {{/ if }}

    {{# if hasSubscriptions }}
      XBehaviors.Live(),
    {{/ if }}
  ]
  {{/ if }}

  // Create an array of indexes
  static indexes = [
    {{# if isSoftdeletable }}
    {key: {"isDeleted": 1 }},
    {{/ if }}
    {{# if isTimestampable }}
    {key: {"createdAt": 1 }},
    {{/ if }}
    {{# if isBlameable }}
    {key: {"createdBy": 1 }},
    {{/ if }}
  ]
  }