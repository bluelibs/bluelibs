import fs, { read } from 'fs';
import shortid from 'shortid';
import os from 'os';
// import { Promise } from 'meteor/promise';

const uploadDir = os.tmpdir();

export const storeFS = ({ stream, filename }): Promise<{
  filepath: string
  id: string
}> => {
  const id = shortid.generate();
  const filepath = `${uploadDir}/${id}-${filename}`;

  return new Promise((resolve, reject) =>
    stream
      .on('error', error => {
        if (stream.truncated) {
          // Delete the truncated file
          fs.unlinkSync(filepath);
        }
        reject(error);
      })
      .pipe(fs.createWriteStream(filepath))
      .on('error', error => reject(error))
      .on('end', () => resolve({ id, filepath }))
      .on('finish', () => resolve({ id, filepath }))
  );
};
