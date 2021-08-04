import * as React from "react";
import { Collection, use, useData } from "@bluelibs/x-ui";
import { UploadProps, Upload, Button } from "antd";
import { ObjectId } from "@bluelibs/ejson";
import { UploadOutlined } from "@ant-design/icons";
import { XUploader, AppFile, AppFileGroup } from "../uploads/XUploader";
import { useState, useEffect } from "react";
import { UploadFile } from "antd/lib/upload/interface";

export type AdminFileGroupUploadProps = UploadProps<any> & {
  value?: ObjectId;
  field: string;
};

export function AdminFileGroupUpload(props: AdminFileGroupUploadProps) {
  let { field, onChange: onFieldChange, value, ...rest } = props;

  const [uploadFileList, setUploadFileList] = useState<UploadFile[]>([]);

  const uploader = use(XUploader);

  useEffect(() => {
    if (value) {
      // Fetch the file group and store the current files that exist
      uploader.getFileGroup(value).then((fileGroup) => {
        setUploadFileList(
          fileGroup.files.map((file) => uploader.transformToUploadFile(file))
        );
      });
    }
  }, []);

  const uploadProps: UploadProps = {
    ...rest,
    name: field,
    async onChange({ file }) {
      const { status } = file;

      if (status === "uploading") {
        setUploadFileList((curr) => {
          return [...curr, file];
        });
      }

      if (status === "done") {
        const appFile = file.response as AppFile;
        setUploadFileList((curr) => {
          return [
            ...curr.filter((c) => c.uid !== file.uid),
            uploader.transformToUploadFile(appFile),
          ];
        });
      }

      if (status === "removed") {
        const newFiles = uploadFileList.filter(
          (f) => f.uid.toString() !== file.uid.toString()
        );

        setUploadFileList(newFiles);
      }
    },

    async customRequest(options) {
      // const { originFileObj: file } = currentFile;
      let groupId = value;
      let createdFileGroup = false;
      if (!groupId) {
        groupId = await uploader.createNewFileGroup();
        createdFileGroup = true;
      }

      const appFile = await uploader.uploadFileToGroup(groupId, options.file);
      options.onSuccess(appFile, null);

      if (createdFileGroup) {
        // @ts-ignore
        onFieldChange(groupId);
      }
    },

    async onRemove(file) {
      await uploader.appFilesCollection.deleteOne(file.uid);
    },

    fileList: uploadFileList,
  };

  return (
    <Upload {...uploadProps}>
      <Button icon={<UploadOutlined />}>Click to upload files</Button>
    </Upload>
  );
}
