import { gql } from "@apollo/client";

export const UPLOAD_FILE = gql`
  mutation UploadFile($upload: Upload!, $context: String) {
    AppFileUpload(upload: $upload, context: $context) {
      _id
      name
      mimeType
      size
      downloadUrl
    }
  }
`;

export const UPLOAD_FILE_TO_GROUP = gql`
  mutation UploadFileToGroup($groupId: ObjectId!, $upload: Upload!, $context: String) {
    AppFileUploadToGroup(groupId: $groupId, upload: $upload, context: $context) {
      _id
      name
      mimeType
      size
      downloadUrl
    }
  }
`;
