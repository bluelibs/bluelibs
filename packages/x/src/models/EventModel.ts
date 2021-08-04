import * as _ from "lodash";
import { GenericModel } from "./GenericModel";
import { ModelRaceEnum } from "./defs";

export class EventModel {
  bundleName: string;
  eventName: string;
  hasInterfaceDefined: boolean;
  interfaceDefinition: GenericModel = new GenericModel(
    "",
    ModelRaceEnum.INTERFACE
  );

  get eventClass() {
    const propperForm = _.upperFirst(_.camelCase(this.eventName));

    return propperForm + "Event";
  }

  get eventInterfaceName() {
    if (this.hasInterfaceDefined) {
      return this.interfaceDefinition.name;
    } else {
      return "any";
    }
  }
}
