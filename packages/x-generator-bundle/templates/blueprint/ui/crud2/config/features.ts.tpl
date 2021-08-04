/** @overridable */
export const features = {
  create: {{# if (hasFeature "create") }}true{{ else }}false{{/ if }},
  delete: {{# if (hasFeature "delete") }}true{{ else }}false{{/ if }},
  edit: {{# if (hasFeature "edit") }}true{{ else }}false{{/ if }},
  list: {{# if (hasFeature "list") }}true{{ else }}false{{/ if }},
  view: {{# if (hasFeature "view") }}true{{ else }}false{{/ if }},
}