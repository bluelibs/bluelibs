import {
  newSmart,
  useRouter,
  useUIComponents,
} from "@bluelibs/x-ui";
import { useEffect, useState, useMemo } from "react";
import { {{ collectionName }}AntTableSmart } from "./{{ collectionName }}TableSmart";
import { PlusOutlined, FilterOutlined } from "@ant-design/icons";
import * as Ant from "antd";
import { Routes } from "@bundles/{{ bundleName }}";
import { features } from "../../config/features";
import { {{ generateComponentName "listFilters "}} } from "./{{ generateComponentName "listFilters" }}";

export function {{ generateComponentName "list" }}() {
  const UIComponents = useUIComponents();
  const router = useRouter();
  const [api, Provider] = newSmart({{ collectionName }}AntTableSmart);
  const [filtersOpened, setFiltersOpened] = useState(false);
  const onFiltersUpdate = useMemo(() => {
    return (filters) => {
      api.setFlexibleFilters(filters);
    };
  }, []);

  return (
    <UIComponents.AdminLayout>
      <Ant.PageHeader
        title="{{ collectionName }} List"
        extra={[
          features.create ?
            <Ant.Button key="1" onClick={() => router.go(Routes.{{ generateRouteName "create" }})} 
              icon={<PlusOutlined />}>
              New {{ entityName }} 
          </Ant.Button> : null,
          <Ant.Button key="2" onClick={() => setFiltersOpened(!filtersOpened)} icon={<FilterOutlined />}>
            Filters
          </Ant.Button>,
        ]}
      />

      {api.state.isError && <Ant.Alert type="error" message="There was an error while fetching data." />}

      <Ant.Layout.Content>
        <Provider>
          <div className="{{ cssClass "list" }}">
            {
              filtersOpened && <{{ generateComponentName "listFilters" }} onUpdate={onFiltersUpdate} />
            }
            <Ant.Input.Search
              name="Search"
              placeholder="Search"
              className="search"
              onKeyUp={(e) => {
                const value = (e.target as HTMLInputElement).value;
                api.setFilters({
                  // Customise your search filters!
                  title: new RegExp(`${value}`, "i"),
                });
              }}
            />
            <Ant.Table {...api.getTableProps()} />
          </div>
        </Provider>
      </Ant.Layout.Content>
    </UIComponents.AdminLayout>
  );
}
