import { Service } from "@bluelibs/core";
import { QueryBodyType } from '@bluelibs/x-ui';
import {
  {{ entityName }}
} from "@bundles/{{ bundleName }}/collections";
import { {{ entityName }}List as Base{{ entityName }}List } from "./{{ entityName }}List.base";

@Service({ transient: true })
export class {{ entityName }}List extends Base{{ entityName }}List {
  build() {
    super.build();
    // Perform additional modifications such as updating how a list item renders or add additional ones

  }

  static getRequestBody(): QueryBodyType<{{ entityName }}> {
    // You have the ability to modify the request by adding certain fields or relations

    return super.getRequestBody();
  }
}
