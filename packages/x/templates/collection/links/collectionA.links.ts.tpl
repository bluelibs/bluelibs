
export const {{ linkFromA }}: IBundleLinkCollectionOption = {
  collection: () => {{ collectionBElement.identityName }},
  {{# if isMany }}
    many: true,
  {{/ if }}
  {{# if linkStoredInA }}
    field: "{{ fieldName }}",
    {{# if isUnique }}
      unique: true,
    {{/ if }}
  {{ else }}
    inversedBy: "{{ linkFromB }}"
  {{/ if }}
}