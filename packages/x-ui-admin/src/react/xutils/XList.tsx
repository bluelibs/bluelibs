import {
  I18NService,
  IComponents,
  XRouter,
  XUI_COMPONENTS_TOKEN,
} from "@bluelibs/x-ui";
import { Inject, Service } from "@bluelibs/core";
import { ColumnType } from "antd/lib/table";
import { Consumer } from "../models";

@Service()
export abstract class XList<T = any> extends Consumer<
  { id: string; order?: number } & ColumnType<T>
> {
  constructor() {
    super();
  }

  @Inject(() => I18NService)
  i18n: I18NService;

  @Inject(XUI_COMPONENTS_TOKEN)
  UIComponents: IComponents;

  @Inject(() => XRouter)
  router: XRouter;

  abstract build();
}
