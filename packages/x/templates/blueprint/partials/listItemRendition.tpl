 {{#*inline "itemRendition"}}
  const props = {
    type: "{{ rendererType }}",
    {{# if (@root.typeIs rendererType "objectId") }}
      value: value.toString()
    {{ else }}
      value,
    {{/ if }}
    {{# if (@root.typeIs rendererType "enum") }}
      labelify: true,
    {{/ if }}
    {{# if (@root.typeIs rendererType "relation") }}
      relation: {
        path: router.path(Routes.{{ routeName }}, {
          params: {
            id: value?._id
          }
        }),
        dataIndex: "{{ remoteField }}"
      }
    {{/ if }}
  };
{{/inline}}

{{# if isMany }}
  return (
    <>
      {
        value && value.map((value: any, idx: number) => {
          {{> itemRendition }}
          return <UIComponents.AdminListItemRenderer {...props} key={idx} />;
        })
      }
    </>
  )
{{ else }}
  {{> itemRendition }}
  return <UIComponents.AdminListItemRenderer {...props} />;
{{/ if }}