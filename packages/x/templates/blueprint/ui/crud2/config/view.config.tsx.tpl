import { Service } from "@bluelibs/core";
import { QueryBodyType } from '@bluelibs/x-ui';
import {
  {{ entityName }}
} from "@bundles/{{ bundleName }}/collections";
import { {{ entityName }}Viewer as Base{{ entityName }}Viewer } from "./{{ entityName }}Viewer.base";

@Service({ transient: true })
export class {{ entityName }}Viewer extends Base{{ entityName }}Viewer {
  build() {
    super.build();

    // Perform additional modifications such as updating rendering functions, labels, description
  }

  static getRequestBody(): QueryBodyType<{{ entityName }}> {
    // You have the ability to modify the request by adding certain fields or relations
    
    return super.getRequestBody();
  }
}
