
export const {{ linkFromB }}: IBundleLinkCollectionOption = {
  collection: () => {{ collectionAElement.identityName }},
  {{# if isMany }}
    many: true,
  {{/ if }}
  {{# if linkStoredInB }}
    field: "{{ fieldName }}",
    {{# if isUnique }}
      unique: true,
    {{/ if }}
  {{ else }}
    inversedBy: "{{ linkFromA }}"
  {{/ if }}  
}