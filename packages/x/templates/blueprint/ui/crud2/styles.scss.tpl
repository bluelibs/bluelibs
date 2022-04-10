{{# if (hasFeature "create") }}
@import "./components/Create/{{ generateComponentName "create" }}.scss";
{{/ if }}
{{# if (hasFeature "list") }}
@import "./components/List/{{ generateComponentName "list" }}.scss";
{{/ if }}
{{# if (hasFeature "edit") }}
@import "./components/Edit/{{ generateComponentName "edit" }}.scss";
{{/ if }}
{{# if (hasFeature "view") }}
@import "./components/View/{{ generateComponentName "view" }}.scss";
{{/ if }}