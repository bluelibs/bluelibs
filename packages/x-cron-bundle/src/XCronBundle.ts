import { Bundle, KernelAfterInitEvent } from "@bluelibs/core";
import { XCronBundleConfigType, ICronConfig } from "./defs";
import { CronService } from "./services/CronService";

export class XCronBundle extends Bundle<XCronBundleConfigType> {
  async hook() {
    this.eventManager.addListener(KernelAfterInitEvent, () => {
      const service = this.container.get(CronService);
      service.start();
    });
  }

  addCron(cronfig: ICronConfig) {
    const service = this.container.get(CronService);
    service.add(cronfig);
  }
}
