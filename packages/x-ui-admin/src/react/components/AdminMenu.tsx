import * as React from "react";
import { Menu as AntdMenu } from "antd";
import {
  use,
  useGuardian,
  useRouter,
  useUIComponents,
  XRouter,
} from "@bluelibs/x-ui";
import { MenuService } from "../../services/MenuService";
import { IMenuItemConfig } from "../../defs";

const AntdSubMenu = AntdMenu.SubMenu;

export function AdminMenu() {
  const menuService = use(MenuService);
  const guardian = useGuardian();
  const router = useRouter();
  const Components = useUIComponents();

  if (!guardian.state.initialised) {
    return null;
  }

  // We filter on each render for now because it should be super fast.
  // Otherwise we would need to do it in each MenuItem which can be cumbersome.
  const items = menuService.items.filter((item) => {
    if (item.roles) {
      return guardian.hasRole(item.roles);
    }

    return true;
  });

  // Detect which paths are active based on their logic
  const { pathname } = router.history.location;
  const selectedOrOpenKeys = getSelectedKeys(items, pathname);

  return (
    <AntdMenu
      mode="inline"
      defaultOpenKeys={selectedOrOpenKeys}
      defaultSelectedKeys={selectedOrOpenKeys}
    >
      {/* Make sure that subitems are right under Menu or it will fail */}
      {items.map((item) => {
        return renderItem(item, router);
      })}
    </AntdMenu>
  );
}

export function renderItem(
  item: IMenuItemConfig,
  router: XRouter
): React.ReactElement {
  if (item.subitems && item.subitems.length) {
    return (
      <AntdSubMenu
        key={item.key}
        title={<ItemRender item={item} />}
        icon={item.icon ? React.createElement(item.icon) : undefined}
        onTitleClick={(e) => {
          if (item.path) {
            router.history.push(item.path);
          }
        }}
      >
        {item.subitems.map((subitem) => {
          return renderItem(subitem, router);
        })}
      </AntdSubMenu>
    );
  }

  return (
    <AntdMenu.Item
      key={item.key}
      onClick={() => {
        if (item.path) {
          router.history.push(item.path);
        }
      }}
      icon={item.icon ? React.createElement(item.icon) : undefined}
    >
      <ItemRender item={item} />
    </AntdMenu.Item>
  );
}

type ItemRenderProps = {
  item: IMenuItemConfig;
  children?: any;
};

function ItemRender(props: ItemRenderProps) {
  const { item } = props;

  if (typeof item.label === "string") {
    return <span>{item.label}</span>;
  }

  return React.createElement(item.label);
}

function getSelectedKeys(items: IMenuItemConfig[], pathname: string) {
  let selectedKeys = [];

  items.forEach((item) => {
    if (item.isSelected) {
      if (item.isSelected(pathname)) {
        selectedKeys.push(item.key ? item.key : item.inject);
      }
    } else if (item.inject === pathname || item.key === pathname) {
      selectedKeys.push(item.key ? item.key : item.inject);
    }

    if (item.subitems) {
      const itemKeys = getSelectedKeys(item.subitems, pathname);
      selectedKeys.push(...itemKeys);
    }
  });

  return selectedKeys;
}
