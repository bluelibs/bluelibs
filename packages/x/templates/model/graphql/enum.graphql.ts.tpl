export default /* GraphQL */ `
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
`