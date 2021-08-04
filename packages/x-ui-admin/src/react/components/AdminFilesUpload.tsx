import * as React from "react";
import { Collection, use, useData } from "@bluelibs/x-ui";
import { UploadProps, Upload, Button } from "antd";
import { ObjectId } from "@bluelibs/ejson";
import { UploadOutlined } from "@ant-design/icons";
import { XUploader, AppFile } from "../uploads/XUploader";
import { useState, useEffect } from "react";
import { UploadFile } from "antd/lib/upload/interface";

export type AdminFilesUploadProps = UploadProps<any> & {
  value?: ObjectId[];
  field: string;
};

export function AdminFilesUpload(props: AdminFilesUploadProps) {
  let { field, onChange: onFieldChange, value, ...rest } = props;
  // Ensure we have an empty array to work with
  value = value || [];
  const [uploadFileList, setUploadFileList] = useState<UploadFile[]>([]);

  const uploader = use(XUploader);

  useEffect(() => {
    if (value) {
      uploader
        .getUploadFiles(value)
        .then((uploadFiles) => setUploadFileList(uploadFiles));
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

        // @ts-ignore
        onFieldChange([...value, appFile._id]);
      }

      if (status === "removed") {
        const newFiles = uploadFileList.filter(
          (f) => f.uid.toString() !== file.uid.toString()
        );

        setUploadFileList(newFiles);

        // @ts-ignore
        onFieldChange(newFiles.map((u) => new ObjectId(u.uid)));
      }
    },

    async customRequest(options) {
      const appFile = await uploader.uploadFile(options.file as File);

      options.onSuccess(appFile, null);
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
