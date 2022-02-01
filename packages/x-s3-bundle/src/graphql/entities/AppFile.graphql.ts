export default /* GraphQL */ `
  type AppFile {
    _id: ID!
    name: String
    path: String!
    downloadUrl: String!
    size: Int!
    mimeType: String!
    thumbs(ids: [String]): [AppFileThumb]!

    resourceType: String
    resourceId: String

    uploadedById: String
    uploadedBy: User

    createdAt: Date
    updatedAt: Date
  }

  type AppFileThumb {
    id: String!
      @deprecated(
        reason: "Use 'type' instead, due to cache mismatch with Apollo"
      )
    type: String!
    path: String!
    downloadUrl: String!
  }
`;
