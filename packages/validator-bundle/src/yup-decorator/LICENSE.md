LICENSE: ISC

This code has been cloned from: https://github.com/tuan231195/yup-decorator
Commit Hash on Clone: 2e135f37e44fe15858ae7ba8e0fc86053e04071f

Reason for including in the repository:

- We needed lazy loading for schema not on declaration, but rather when it's used.
- We now instantiate the schema on the first usage and store it in the constructor as a symbol
