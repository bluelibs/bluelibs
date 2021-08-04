export default {
  typeDefs: `
    input QueryInput {
      filters: EJSON
      options: QueryOptionsInput
    }

    input QueryOptionsInput {
      sort: JSON
      limit: Int
      skip: Int
      """
      This is the Nova body that will get merged deeply with your request body. Useful for passing arguments.
      """
      sideBody: EJSON
    }

    input DocumentUpdateInput {
      _id: ObjectId!
      modifier: EJSON!
    }
  `,
};
