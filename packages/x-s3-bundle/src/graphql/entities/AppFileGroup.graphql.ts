export default /* GraphQL */ `
  type AppFileGroup {
    _id: ObjectId!
    name: String
    files: [AppFile]!
    filesIds: [ObjectId]!
  }
`;
