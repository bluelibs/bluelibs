import { Dashboard } from "./Dashboard";
import { DashboardOutlined } from "@ant-design/icons";

export const DASHBOARD = {
  path: "/dashboard",
  component: Dashboard,
  menu: {
    key: "Dashboard",
    label: "Dashboard",
    order: 0,
    icon: DashboardOutlined,
  },
};
