import { Inject, Service } from "@bluelibs/core";
import { XRouter } from "@bluelibs/x-ui";
import { ReactElement } from "react";

export interface IItemBase {
  id: string;
  route: (router: XRouter) => string;
  label?: string;
  icon?: ReactElement<any>;
  order?: number;
}

@Service()
export abstract class SectionBase<T extends IItemBase> {
  items: T[];
  private isFrozen: boolean = true;

  @Inject(() => XRouter)
  router: XRouter;

  add(item: T) {
    this.isFrozen && this.throwFrozen();

    if (!item.label) {
      item.label = item.id;
    }

    // Add the route
    this.items.push(item);
  }

  get(id: string) {
    return this.items.find((item) => item.id === id);
  }

  remove(id: string) {
    this.isFrozen && this.throwFrozen();

    this.items = this.items.filter((item) => {
      item.id === id;
    });
  }

  freeze() {
    this.isFrozen = true;
    Object.freeze(this.items);
  }

  protected throwFrozen() {
    throw new Error(
      "This section is frozen, you can no longer perform modifications to it."
    );
  }
}
