export default /* GraphQL */ `
  input {{ modelClass }} {
    {{ toGraphQL }}
  }

  {{# each localModels }}
    input {{ name }} {
      {{ @root.toGraphQLSubmodel this }}
    }
  {{/ each }}
  
  {{# each embeddedModels }}
    input {{ name }} {
      {{ @root.toGraphQLSubmodel this }}
    }
  {{/ each }}
`