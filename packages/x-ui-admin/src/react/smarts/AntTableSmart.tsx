import * as React from "react";
import {
  Collection,
  I18NService,
  IComponents,
  ListSmart,
  QueryBodyType,
  XRouter,
  XUI_COMPONENTS_TOKEN,
} from "@bluelibs/x-ui";
import { ColumnsType, TablePaginationConfig, TableProps } from "antd/lib/table";
import { Button, Dropdown, Menu, Popconfirm } from "antd";
import { Constructor, Inject } from "@bluelibs/core";
import * as moment from "moment";

const AntTableContext = React.createContext(null);

export abstract class AntTableSmart<T = any> extends ListSmart<T> {
  @Inject(() => XRouter)
  router: XRouter;

  @Inject(XUI_COMPONENTS_TOKEN)
  UIComponents: IComponents;

  @Inject(() => I18NService)
  i18n: I18NService;

  abstract collectionClass: Constructor<Collection<T>>;

  abstract getBody(): QueryBodyType<T>;
  abstract getColumns(): ColumnsType<T>;

  static getContext() {
    return AntTableContext;
  }

  getTableProps() {
    const columns = this.getColumns();
    const props: TableProps<T> = {
      dataSource: this.state.documents,
      columns,
      loading: this.state.isLoading,
      pagination: this.getUIPaginationConfig(),
      onChange: this.onTableChange.bind(this),
      // @ts-ignore
      rowKey: (item) => item._id,
    };

    if (columns.length > 6 + 1) {
      // +1, from actions
      props.scroll = {
        x: columns.length * 200,
      };
    }

    return props;
  }

  onTableChange(filters, pagination, sorter) {
    if (sorter.field) {
      let field = Array.isArray(sorter.field)
        ? sorter.field.join(".")
        : sorter.field;

      if (this.getSortMap()[field]) {
        field = this.getSortMap()[field];
      }

      this.updateSort(field, sorter.order === "descend" ? -1 : 1);
    }
  }

  /**
   * This is used so you can map certain fields to certain sorts. For example you only get the dataIndex specified.
   */
  getSortMap(): { [key: string]: string } {
    return {};
  }

  /**
   * Based on certain specific values generate how the filters should look like
   * @returns
   */
  getFilterMap(): { [key: string]: (value) => any } {
    return {};
  }

  /**
   * This method allows you to super easily create a dropdown
   * @param model
   * @param actions
   * @returns
   */
  generateActions(model: T, actions: AntListActionsType<T>) {
    const menu = (
      <Menu>
        {actions.items.map((item) => {
          const props: any = {
            key: item.label,
            onClick: undefined,
          };
          if (item.icon) {
            props.icon = item.icon;
          }

          let children: string | React.ReactElement = item.label;

          if (item.confirm) {
            children = (
              <Popconfirm
                title={item.confirm}
                onConfirm={() => {
                  item.action(model);
                }}
              >
                {item.label}
              </Popconfirm>
            );
          } else {
            props.onClick = () => item.action(model);
          }

          return <Menu.Item {...props}>{children}</Menu.Item>;
        })}
      </Menu>
    );

    return (
      <Dropdown overlay={menu}>
        <Button icon={actions.icon}>{actions.label}</Button>
      </Dropdown>
    );
  }

  getUIPaginationConfig(): false | TablePaginationConfig {
    const options: TablePaginationConfig = {
      position: ["bottomCenter"],
      defaultCurrent: this.state.currentPage,
      pageSize: this.state.perPage,
      onChange: (page) => {
        this.setCurrentPage(page);
      },
      total: this.state.totalCount,
    };

    return options;
  }

  getRouter(): XRouter {
    return this.container.get(XRouter);
  }

  /**
   * This basically means that it transforms the filters specified into custom mongo filters ready to use
   * @param filters
   */
  setFlexibleFilters(filters: any) {
    const $and = this.extractFilters(filters);

    if ($and.length === 0) {
      this.setFilters({});
    } else {
      // @ts-ignore
      this.setFilters({
        $and,
      });
    }
  }

  /**
   * Method is used to guess how to transform the filter unless there's mapper for it.
   * This method currently is too if-sy, should later create a FilterExtractor separate class
   *
   * @param filters
   * @returns
   */
  protected extractFilters(filters: any, keyPrefix: string = ""): any[] {
    const $and = [];
    const filterMap = this.getFilterMap();
    const push = (key, value) => {
      $and.push({
        [keyPrefix + key]: value,
      });
    };

    for (const key in filters) {
      const value = filters[key];
      if (
        value === undefined ||
        value === null ||
        (Array.isArray(value) && value.length === 0)
      ) {
        // These values we consider non-filters.
        continue;
      }

      if (filterMap[key]) {
        push(filterMap[key], filters[key]);
        continue;
      }

      if (Array.isArray(value)) {
        if (moment.isMoment(value[0]) && value.length === 2) {
          // We detect a date-range
          push(key, {
            $gte: value[0].startOf("day").toDate(),
            $lte: value[1].endOf("day").toDate(),
          });
        } else if (typeof value[0] === "number" && value.length === 2) {
          // Number range detected
          push(key, {
            $gte: value[0],
            $lte: value[1],
          });
        }

        // most likely array of objectIds
        else
          push(key, {
            $in: filters[key],
          });
      } else {
        if (typeof filters[key] === "string") {
          if (filters[key] !== "") {
            push(key, new RegExp(filters[key], "i"));
          }
        } else {
          if (typeof filters[key] === "object") {
            const objectFilters = this.extractFilters(filters[key], key + ".");

            if (objectFilters.length) {
              $and.push(...objectFilters);
            }
          } else {
            push(key, {
              $in: Array.isArray(filters[key]) ? filters[key] : [filters[key]],
            });
          }
        }
      }
    }

    return $and;
  }
}

export type AntListActionsType<T> = {
  label: string;
  icon?: React.ReactElement;
  items: AntListActionsItemType<T>[];
};

export type AntListActionsItemType<T> = {
  label: string;
  icon?: React.ReactElement;
  /**
   * This can ask for confirmation to proceed to action
   */
  confirm?: string;
  action: (model: T) => any;
};
