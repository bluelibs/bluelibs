import * as X from "@bluelibs/x-bundle";
import { IResolverMap } from "@bluelibs/graphql-bundle";

{{ collectionImportLine }}
{{ inputImportLine  }}
{{ serviceImportLine }}

export default {
  Query: {
    {{ queryName }}: [
      {{# if checkLoggedIn }}
        X.CheckLoggedIn(),
      {{/ if }}
      {{# if permissionCheck }}
        X.CheckPermission(['ADMIN']),
      {{/ if }}
      {{# if checkCollectionExistence }}
        X.CheckDocumentExists({{ collectionClass }})
      {{/ if }}
      {{# if hasInput }}
        X.ToModel({{ inputClass }}),
        X.Validate(),
      {{/ if }}
      {{{ endOperation }}}
    ]
  }
} as IResolverMap;