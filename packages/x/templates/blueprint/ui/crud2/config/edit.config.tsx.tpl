import { Service } from "@bluelibs/core";
import { {{ entityName }}EditForm as Base{{ entityName }}EditForm } from "./{{ entityName }}EditForm.base";
import { QueryBodyType } from '@bluelibs/x-ui';
import {
  {{ entityName }}
} from "@bundles/{{ bundleName }}/collections";

@Service({ transient: true })
export class {{ entityName }}EditForm extends Base{{ entityName }}EditForm {
  build() {
    super.build();

    // Perform additional modifications such as updating rendering functions, labels, description
  }

  static getRequestBody(): QueryBodyType<{{ entityName }}> {
    // You have the ability to modify the request by adding certain fields or relations
    
    return super.getRequestBody();
  }
}
