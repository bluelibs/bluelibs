import * as os from "os";
import * as sharp from "sharp";
import { X_S3_CONFIG_TOKEN } from "../constants";
import { Inject } from "@bluelibs/core";
import { XS3BundleConfigType } from "../defs";

const uploadDir = os.tmpdir();

export class ImageService {
  constructor(
    @Inject(X_S3_CONFIG_TOKEN)
    protected readonly config: XS3BundleConfigType
  ) {}

  async getImageThumbs(
    buffer: Buffer,
    context: string
  ): Promise<{ [id: string]: Buffer }> {
    const thumbs = this.config.thumbs;
    const thumbsByContext = thumbs.filter((t) => {
      if (t.contexts) {
        return t.contexts.includes(context);
      }
      return true;
    });

    const response: { [id: string]: Buffer } = {};

    for (const thumbConfig of thumbsByContext) {
      response[thumbConfig.id] = await sharp(buffer)
        .resize(thumbConfig.width, thumbConfig.height)
        .toBuffer();
    }

    return response;
  }

  public isMimeTypeImage(mimeType): boolean {
    return mimeType.indexOf("image") !== -1;
  }
}
