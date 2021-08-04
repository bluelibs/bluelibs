export default /* GraphQL */ `
  type {{ modelClass }} {
    {{ toGraphQL }}
  }

  {{# each localModels }}
    type {{ name }} {
      {{ @root.toGraphQLSubmodel this }}
    }
  {{/ each }}
  
  {{# each embeddedModels }}
    type {{ name }} {
      {{ @root.toGraphQLSubmodel this }}
    }
  {{/ each }}

  {{# each enums }}
    enum {{ className }} {
      {{# each elements }}
        {{ field }}
      {{/ each }}
    }
  {{/ each }}
`
