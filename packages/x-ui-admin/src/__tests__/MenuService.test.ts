import { IMenuItemConfig } from "../defs";
import { MenuService } from "../services/MenuService";

test("[MenuService] should work", () => {
  const menu = new MenuService();

  menu.add({
    key: "Abc",
    path: "/home",
  });

  expect(menu.items).toHaveLength(1);
  expect(menu.items[0].label).toBe("Abc");
});

test("[MenuService] injection", () => {
  const menu = new MenuService();
  let item;

  menu.add({
    key: "Users",
    path: "/users",
  });
  menu.add({
    key: "Dashboard",
    path: "/dashboard",
  });

  menu.add({
    key: "DashboardStatistics",
    path: "/dashboard/stats",
    inject: "Dashboard",
  });

  expect(menu.items).toHaveLength(2);
  item = menu.getItem("Dashboard");
  expect(item.subitems).toHaveLength(1);
  expect(item.subitems[0].key).toBe("DashboardStatistics");

  expect(menu.allItems).toHaveLength(3);

  // This should add an extra nesting layer
  menu.add({
    key: "UsersNest",
    path: "/users/something/nested",
    inject: "Users.Statistics.Nested",
  });

  expect(menu.allItems).toHaveLength(6);
});

test("[MenuService] isSelected", () => {
  const menu = new MenuService();
  let item: IMenuItemConfig;

  menu.add({
    key: "Users",
    path: "/users",
  });
  menu.add({
    key: "Dashboard",
    path: "/dashboard",
  });

  item = menu.getItem("Users");
  expect(item.isSelected("/users")).toBe(true);
  expect(item.isSelected("/users/test")).toBe(true);
  expect(item.isSelected("/userx")).toBe(false);
});
