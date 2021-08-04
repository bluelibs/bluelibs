import { Service } from "@bluelibs/core";
import { IMenuItemConfig } from "../defs";
import * as startCase from "lodash.startcase";

@Service()
export class MenuService {
  public readonly items: IMenuItemConfig[] = [];
  /**
   * All items stored in a flat structure.
   */
  public readonly allItems: IMenuItemConfig[] = [];

  /**
   *
   * @param item
   */
  add(item: IMenuItemConfig) {
    this.prepareItem(item);
    if (item.inject) {
      const parts = item.inject.split(".");
      // Automatically adds it to items list
      this.injectItem(null, parts, item);
    } else {
      this.addSubitem(this.items, item);
    }
  }

  protected addSubitem(
    parent: IMenuItemConfig | IMenuItemConfig[],
    item: IMenuItemConfig
  ) {
    if (Array.isArray(parent)) {
      parent.push(item);
      this.sort(parent);
    } else {
      parent.subitems.push(item);
      this.sort(parent.subitems);
    }
    this.allItems.push(item);
  }

  /**
   * This fills in the missing gaps of the item
   * @param item
   */
  protected prepareItem(item: IMenuItemConfig) {
    if (item.route) {
      if (!item.path) {
        item.path = item.route.path;
      }
      if (!item.roles && item.route.roles) {
        item.roles = item.route.roles;
      }
    }
    if (!item.label) {
      item.label = this.labelify(item.key);
    }

    if (!item.isSelected) {
      item.isSelected = this.createIsSelected(item);
    }

    if (item.order === undefined || item.order === null) {
      item.order = 1000;
    }

    if (!item.subitems) {
      item.subitems = [];
    }
  }

  /**
   * This function adds and blends in a menu item based on the provided path.
   * @param parent
   * @param parts
   */
  injectItem(
    parent: null | IMenuItemConfig,
    parts: string[],
    item: IMenuItemConfig
  ) {
    // Sanity checks
    if (parts.length === 0) {
      if (parent === null) {
        this.addSubitem(this.items, item);
      } else {
        this.addSubitem(parent, item);
      }
    } else {
      let foundItem: IMenuItemConfig;
      const [currentPart, ...restParts] = parts;
      // Is a root
      const itemsList = parent === null ? this.items : parent.subitems;

      foundItem = this.items.find((item) => item.key === currentPart);
      if (!foundItem) {
        foundItem = {
          key: currentPart,
          label: this.labelify(currentPart),
          subitems: [],
        };

        this.addSubitem(itemsList, foundItem);
      }

      this.injectItem(foundItem, restParts, item);
    }
  }

  sort(items: IMenuItemConfig[]) {
    items.sort(function (a, b) {
      if (a.order < b.order) {
        return -1;
      }
      if (a.order > b.order) {
        return 1;
      }
      return 0;
    });
  }

  createIsSelected(item: IMenuItemConfig) {
    return (pathname: string) => {
      if (item.path === pathname) {
        return true;
      }
      if (pathname.indexOf(item.path) >= 0) {
        return true;
      }

      return false;
    };
  }

  /**
   * Get the item by its unique key
   * @param key
   */
  getItem(key: string): IMenuItemConfig | null {
    return this.allItems.find((item) => item.key === key);
  }

  /**
   * This just does a 'join', to ensure that you can easily compose the path maybe benefiting autocompletion
   * MenuService.getPath([USERS_MENU, USERS_STATICIS_SUBMENU])
   * @param strings
   */
  getPath(strings: string[]) {
    return strings.join(".");
  }

  /**
   * TODO: Make it look like a nice label
   * @param label
   */
  labelify(label: string) {
    return startCase(label);
  }
}
