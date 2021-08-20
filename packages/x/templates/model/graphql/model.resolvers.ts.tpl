export default {
  resolvers: {
    {{ modelClass }}: {
      
    },
    {{# each localModels }}
      {{ name }}: {},
    {{/ each }}
    {{# each enums }}
      {{ className }}: {
        {{# each elements }}
          {{ id }}: "{{ value }}",
        {{/ each }}
      },
    {{/ each }}
  }
}