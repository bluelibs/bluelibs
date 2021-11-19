import * as Ant from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import * as React from "react";
import { FormListFieldData, FormListOperation } from "antd/lib/form/FormList";
import AntInput from "antd/lib/input/Input";
import { Consumer } from "../models/Consumer";
import {
  I18NService,
  IComponents,
  use,
  XRouter,
  XUI_COMPONENTS_TOKEN,
} from "@bluelibs/x-ui";
import { Inject, Service } from "@bluelibs/core";
import { Rule } from "antd/lib/form";

export type XFormElementBaseType = {
  id: string;
  name: (string | number)[];
  isList?: boolean;
  /**
   * Show a tooltip representing what the form does
   */
  tooltip?: string;
  required?: boolean;
  order?: number;
  fieldKey?: (string | number)[];
  label?: string;
  rules?: Rule[];
  /**
   * The initial value for the form
   */
  initialValue?: any;
  /**
   * This represents an Ant component especially useful when you want a custom renderer.
   */
  component?: React.ComponentType;
  /**
   * Pass properties to the component input. Warning: this doesn't work with a custom render() function.
   */
  componentProps?: any;
  /**
   * Pass additional items when using "component"-based rendering. This works with custom render functions.
   */
  formItemProps?: Partial<Ant.FormItemProps>;
  listRenderer?: () => ListChildrenFunction;
};

export type XFormRenderFormItemOptions = {
  props: any;
  isFromList: boolean;
};

const XFormRenderFormItemOptionsDefaults: XFormRenderFormItemOptions = {
  props: {},
  isFromList: false,
};

export type XFormElementLeafType = XFormElementBaseType & {
  /**
   * If you have supplied component
   */
  render?: React.ComponentType<Ant.FormItemProps>;
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
export abstract class XForm<T = null> extends Consumer<XFormElementType> {
  @Inject(XUI_COMPONENTS_TOKEN)
  UIComponents: IComponents;

  @Inject(() => I18NService)
  i18n: I18NService;

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
      const name = item.name || item.id.split(".");

      return (
        <Ant.Form.List name={name} key={item.id}>
          {this.createListRenderer(item)}
        </Ant.Form.List>
      );
    } else {
      return this.renderFormItem(item);
    }
  }

  /**
   * Update the element information. If you're specifying a component, the render function will be set to null.
   * @param id
   * @param data
   */
  update(id: string, data: Partial<XFormElementType>) {
    const newData: Partial<XFormElementType> = Object.assign({}, data);

    if (newData.component) {
      newData["render"] = undefined;
    } else if (newData["render"]) {
      newData["nest"] = undefined;
      newData["component"] = undefined;
      newData.componentProps = {};
    }

    super.update(id, newData);
  }

  protected isLeaf(item: XFormElementType): item is XFormElementLeafType {
    if (item["nest"]) {
      return false;
    }

    return true;
  }

  /**
   *
   * @param item
   * @param propsOverride Can customise the ending props reaching the component
   * @returns
   */
  protected renderFormItem(
    item: XFormElementType,
    options: Partial<XFormRenderFormItemOptions> = XFormRenderFormItemOptionsDefaults
  ) {
    const { t } = this.i18n;

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
    const label = item.label === undefined ? item.id : item.label;
    const required = item.required || false;
    const tooltip = item.tooltip || undefined;
    const rules = item.rules || [];
    const UIComponents = this.UIComponents;
    let initialValue = item.initialValue || undefined;

    if (options.isFromList) {
      // List elements should have initial value stored at the top as per ant docs
      initialValue = undefined;
    }

    const props: Ant.FormItemProps = {
      name,
      label,
      required,
      tooltip,
      rules,
      initialValue,
      fieldKey: item.fieldKey,
      ...options.props,
      ...(item.formItemProps || {}),
    };

    if (props.rules.length === 0 && props.required) {
      props.rules.push({
        required: true,
        message: t("generics.forms.field_required", { field: label }),
      });
    }

    // Create a "render" from the component instructions
    if (!item.render && item.component) {
      this.createRenderFunctionFromComponentDefinitions(item);
    }

    return (
      <UIComponents.ErrorBoundary key={item.id}>
        {React.createElement(item.render, props)}
      </UIComponents.ErrorBoundary>
    );
  }

  protected createRenderFunctionFromComponentDefinitions(
    item: XFormElementLeafType
  ) {
    item.render = (props) => (
      <Ant.Form.Item {...props}>
        {React.createElement(item.component, item.componentProps || {})}
      </Ant.Form.Item>
    );
  }

  /**
   * Renderes list of items (dynamic add/remove elements)
   * @param item
   * @returns
   */
  protected createListRenderer(item: XFormElementType): ListChildrenFunction {
    if (item.listRenderer) {
      return item.listRenderer();
    }

    const label = item.label || item.id;
    const isSingleInputList = this.isLeaf(item);

    if (isSingleInputList) {
      return (fields: FormListFieldData[], { add, remove }, { errors }) => (
        <>
          <Ant.Form.Item label={label} initialValue={item.initialValue}>
            {fields.map((field, index) => (
              <>
                {this.renderFormItem(
                  {
                    ...item,
                    label: null,
                  },
                  { props: field, isFromList: true }
                )}
                <MinusCircleOutlined
                  className="dynamic-delete-button"
                  onClick={() => remove(field.name)}
                />
              </>
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
    } else {
      return (fields: FormListFieldData[], { add, remove }, { errors }) => (
        <>
          <Ant.Form.Item label={label}>
            {fields.map((field, index) => (
              <Ant.Form.Item label={null} required={false} key={field.key}>
                {this.renderFormItem({
                  ...item,
                  // Manipulate nesting to contain proper fieldKey and name
                  nest: (item as XFormElementNestType).nest.map((subitem) => {
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
}
