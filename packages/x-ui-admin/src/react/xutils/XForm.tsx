import * as Ant from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import * as React from "react";
import { FormListFieldData, FormListOperation } from "antd/lib/form/FormList";
import AntInput from "antd/lib/input/Input";
import { Consumer } from "../models/Consumer";
import { IComponents, use, XRouter, XUI_COMPONENTS_TOKEN } from "@bluelibs/x-ui";
import { Inject, Service } from "@bluelibs/core";

export type XFormElementBaseType = {
  id: string;
  name: (string | number)[];
  tooltip?: string;
  order?: number;
  required?: boolean;
  fieldKey?: (string | number)[];
  label?: string;
  isList?: boolean;
  listRenderer?: () => ListChildrenFunction;
};

export type XFormElementLeafType = XFormElementBaseType & {
  render: React.ComponentType<Ant.FormItemProps>;
};

export type XFormElementNestType = XFormElementBaseType & {
  name?: (string | number)[];
  nest: XFormElementType[];
  /**
   * Whether it's true the columns will be split by the numbers of nested elements
   * If it's an array of numbers, we'll work with 24 columns per row and you split them as you wish [8, 16, 8]
   */
  columns?: boolean | number[];
};

export type XFormElementType = XFormElementLeafType | XFormElementNestType;

export type ListChildrenFunction = (
  fields: FormListFieldData[],
  operation: FormListOperation,
  meta: {
    errors: React.ReactNode[];
  }
) => React.ReactNode;

@Service({ transient: true })
export abstract class XForm extends Consumer<XFormElementType> {
  @Inject(XUI_COMPONENTS_TOKEN)
  UIComponents: IComponents;

  @Inject(() => XRouter)
  router: XRouter;

  constructor() {
    super();
  }

  /**
   * Use this function to add the default elements to your form
   */
  abstract build();

  render(item?: string | XFormElementType | XFormElementType[]) {
    if (item === undefined) {
      return this.render(this.rest());
    }

    if (typeof item === "string") {
      return this.render(this.consume(item));
    }

    if (Array.isArray(item)) {
      return <>{item.map((item) => this.render(item))}</>;
    }

    if (item.isList) {
      if (!this.isLeaf(item)) {
        const name = item.name || item.id.split(".");
        return (
          <Ant.Form.List name={name} key={item.id}>
            {this.createListRenderer(item)}
          </Ant.Form.List>
        );
      } else {
        throw new Error(
          `You cannot have a list of items (${item.id}) and not have a nest: [] option.`
        );
      }
    } else {
      return this.createFormItem(item);
    }
  }

  protected isLeaf(item: XFormElementType): item is XFormElementLeafType {
    if (item["nest"]) {
      return false;
    }

    return true;
  }

  createFormItem(item: XFormElementType) {
    if (!this.isLeaf(item)) {
      if (!item.columns) {
        return this.render(item.nest);
      } else {
        let columns;

        if (Array.isArray(item.columns)) {
          columns = item.columns;
        } else {
          columns = new Array(item.nest.length).fill(
            Math.floor(24 / item.nest.length)
          );
        }

        const elements = [];
        for (let i = 0; i < item.nest.length; i++) {
          elements.push(
            <Ant.Col span={columns[i]} key={i}>
              {this.render(item.nest[i])}
            </Ant.Col>
          );
        }

        return <Ant.Row gutter={2}>{elements}</Ant.Row>;
      }
    }

    const name = item.name || item.id.split(".");
    const label = item.label || item.id;
    const required = item.required || false;
    const tooltip = item.tooltip || undefined;
    const UIComponents = this.UIComponents;
    const props: Ant.FormItemProps = {
      name,
      label,
      required,
      tooltip,
      fieldKey: item.fieldKey,
    };

    return (
      <UIComponents.ErrorBoundary key={item.id}>
        {React.createElement(item.render, props)}
      </UIComponents.ErrorBoundary>
    );
  }

  /**
   * Renderes list of items (dynamic add/remove elements)
   * @param item
   * @returns
   */
  createListRenderer(item: XFormElementNestType): ListChildrenFunction {
    if (item.listRenderer) {
      return item.listRenderer();
    }

    const label = item.label || item.id;
    return (fields: FormListFieldData[], { add, remove }, { errors }) => (
      <>
        <Ant.Form.Item label={label}>
          {fields.map((field, index) => (
            <Ant.Form.Item label={null} required={false} key={field.key}>
              {this.createFormItem({
                ...item,
                nest: item.nest.map((subitem) => {
                  return {
                    ...subitem,
                    fieldKey: [field.fieldKey, subitem.id],
                    name: [field.name, subitem.id],
                  };
                }),
              })}
              <MinusCircleOutlined
                className="dynamic-delete-button"
                onClick={() => remove(field.name)}
              />
            </Ant.Form.Item>
          ))}
          <Ant.Form.Item>
            <Ant.Button
              type="dashed"
              onClick={() => add()}
              icon={<PlusOutlined />}
            >
              Add New Item
            </Ant.Button>
            <Ant.Form.ErrorList errors={errors} />
          </Ant.Form.Item>
        </Ant.Form.Item>
      </>
    );
  }
}
