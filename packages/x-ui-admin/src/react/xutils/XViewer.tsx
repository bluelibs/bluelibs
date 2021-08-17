import * as React from "react";
import { Consumer } from "../models/Consumer";
import {
  I18NService,
  IComponents,
  use,
  XRouter,
  XUI_COMPONENTS_TOKEN,
} from "@bluelibs/x-ui";
import { Inject, Service } from "@bluelibs/core";

export type XViewElementType = {
  id: string;
  label?: string;
  dataIndex: string[];
  /**
   * If it's nested a component is not needed
   */
  render?: (value) => JSX.Element;
};

export abstract class XViewer extends Consumer<XViewElementType> {
  @Inject(XUI_COMPONENTS_TOKEN)
  UIComponents: IComponents;

  @Inject(() => I18NService)
  i18n: I18NService;

  @Inject(() => XRouter)
  router: XRouter;

  protected document: object;

  constructor() {
    super();
  }

  getValue(dataIndex: string[]) {
    return this.getFromDataIndex(this.document, dataIndex);
  }

  /**
   * Use this function to add elements for the document
   */
  abstract build();

  /**
   * Stores the document that you want to use
   * @param document
   */
  public setDocument(document: object) {
    this.document = document;
  }

  /**
   * Renders the item recursively
   *
   * @param item
   * @returns
   */
  render(item?: string | XViewElementType | XViewElementType[]) {
    if (item === undefined) {
      return this.render(this.rest());
    }

    if (typeof item === "string") {
      return this.render(this.consume(item));
    }

    if (Array.isArray(item)) {
      return <>{item.map((item) => this.render(item))}</>;
    }

    return this.createViewItem(item);
  }

  /**
   * Renders an individual item
   * @param item
   * @returns
   */
  createViewItem(item: XViewElementType) {
    const render =
      item.render ||
      function (value) {
        return value;
      };

    return render(this.getValue(item.dataIndex));
  }

  /**
   * Recursively get data from index document ['profile', 'firstName']
   * @param document
   * @param array
   * @returns
   */
  protected getFromDataIndex(document, array: string[]) {
    if (array.length === 0) {
      return document;
    }

    if (!document) {
      return null;
    }

    return this.getFromDataIndex(document[array.shift()], array);
  }
}
