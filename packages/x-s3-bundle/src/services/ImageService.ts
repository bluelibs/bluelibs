import * as os from "os";
import * as sharp from "sharp";
import { UPLOAD_CONFIG } from "../constants";
import { Inject } from "@bluelibs/core";
import { XS3BundleConfigType } from "../defs";

const uploadDir = os.tmpdir();

export class ImageService {
  constructor(
    @Inject(UPLOAD_CONFIG)
    protected readonly config: XS3BundleConfigType
  ) {}

  async getImageThumbs(
    buffer: Buffer,
    context: string,
    storeId?: string
  ): Promise<{ [id: string]: Buffer }> {
    const store = this.config.stores.find((st) => st.id === storeId);
    const thumbs = store && store.thumbs ? store.thumbs : this.config.thumbs;
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
