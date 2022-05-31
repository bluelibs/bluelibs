import {
  newSmart,
  useRouter,
  useUIComponents,
  useTranslate,
} from "@bluelibs/x-ui";
import { useEffect, useState, useMemo } from "react";
import { {{ collectionName }}AntTableSmart } from "./{{ collectionName }}TableSmart";
import { PlusOutlined, FilterOutlined } from "@ant-design/icons";
import * as Ant from "antd";
import { Routes } from "@bundles/{{ bundleName }}";
import { features } from "../../config/features";
import { {{ generateComponentName "listFilters "}} } from "./{{ generateComponentName "listFilters" }}";
{{# if uiCrudSheild }}
import { useGuardian } from "@bluelibs/x-ui-guardian-bundle";
import { {{ entityName }}SecurityConfig } from "../config/{{ entityName }}.crud.sheild";
import { sheildCrudOperation } from "@bluelibs/x-ui-admin";

let loggedInUser;
{{/ if }}

export function {{ generateComponentName "list" }}() {
  const UIComponents = useUIComponents();
  const router = useRouter();
  const t = useTranslate();
  const [api, Provider] = newSmart({{ collectionName }}AntTableSmart);
  const [filtersOpened, setFiltersOpened] = useState(false);
  {{# if uiCrudSheild }}
  loggedInUser = useGuardian()?.state?.user;
  {{/ if }}
  const onFiltersUpdate = useMemo(() => {
    return (filters) => {
      api.setFlexibleFilters(filters);
    };
  }, []);

  return (
    <UIComponents.AdminLayout>
      <Ant.PageHeader
        title={t('management.{{ generateI18NName }}.list.header')}
        extra={[
          features.create {{# if uiCrudSheild }} && sheildCrudOperation(loggedInUser, "create", {}, {{ entityName }}SecurityConfig) {{/ if }}?
            <Ant.Button key="1" onClick={() => router.go(Routes.{{ generateRouteName "create" }})} 
              icon={<PlusOutlined />}>
              {t('management.{{ generateI18NName }}.list.create_btn')}
          </Ant.Button> : null,
          <Ant.Button key="2" onClick={() => setFiltersOpened(!filtersOpened)} icon={<FilterOutlined />}>
            {t('generics.list_filters')}
          </Ant.Button>,
        ]}
      />

      {api.state.isError && <Ant.Alert type="error" message={t('generics.error_message')} />}

      <Ant.Layout.Content>
        <Provider>
          <div className="{{ cssClass "list" }}">
            {
              filtersOpened && <{{ generateComponentName "listFilters" }} onUpdate={onFiltersUpdate} />
            }
            <Ant.Input.Search
              name="Search"
              placeholder={t('generics.list_search')}
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
