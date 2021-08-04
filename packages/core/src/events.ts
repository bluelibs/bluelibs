import { Bundle } from "./models/Bundle";
import { Event } from "./models/EventManager";
import { Kernel } from "./models/Kernel";

export class KernelBeforeInitEvent extends Event<{ kernel: Kernel }> {}
export class KernelAfterInitEvent extends Event<{ kernel: Kernel }> {}

interface BundleRelatedEventType {
  bundle: Bundle;
}

export class BundleBeforePrepareEvent extends Event<BundleRelatedEventType> {}

export class BundleAfterPrepareEvent extends Event<BundleRelatedEventType> {}

export class BundleBeforeInitEvent extends Event<BundleRelatedEventType> {}

export class BundleAfterInitEvent extends Event<BundleRelatedEventType> {}
