export default /* GraphQL */ `
  type Query {
    AppFilesFindOne(query: QueryInput!): AppFile
    AppFilesFind(query: QueryInput!): [AppFile]
    AppFileGroupsFindOne(query: QueryInput!): AppFileGroup
    AppFileGroupsFind(query: QueryInput!): [AppFileGroup]
  }

  type Mutation {
    AppFileGroupsInsertOne(document: EJSON!): AppFileGroup

    AppFilesDeleteOne(_id: ObjectId!): Boolean
    AppFileGroupsDeleteOne(_id: ObjectId!): Boolean

    AppFileUploadToGroup(
      groupId: ObjectId!
      upload: Upload!
      context: String
    ): AppFile
    AppFileUpload(upload: Upload!, context: String): AppFile
  }
`;
