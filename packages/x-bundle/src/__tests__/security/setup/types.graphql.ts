export default /* GraphQL */ `
  type Post {
    _id: String!
    title: String!
    description: String!
    private: Boolean
    adminOnlyField: String
    ownerId: String
  }

  type Query {
    PostsFindOne(query: QueryInput): Post
    PostsFind(query: QueryInput): [Post]!
    PostsCount(query: QueryInput): Int!
  }

  type Mutation {
    login(input: LoginInput!): LoginResponse!
    PostsInsertOne(document: EJSON!): Post
    PostsUpdateOne(_id: String!, document: EJSON!): Post!
    PostsDeleteOne(_id: String!): Boolean
  }

  type LoginResponse {
    token: String!
  }

  input LoginInput {
    username: String!
    password: String!
    #sessionToken is the id of the multiple authentication factor method, to track which method the user has unlocked
    sessionToken: String
  }
`;
