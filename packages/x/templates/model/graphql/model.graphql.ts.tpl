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
      {{# if description }}
        """
        {{ description }}
        """
      {{/ if }}
      {{# each elements }}
        {{ id }}
      {{/ each }}
    }
  {{/ each }}
`
