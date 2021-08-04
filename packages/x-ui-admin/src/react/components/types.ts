import "@bluelibs/x-ui";
import * as Components from "./index";
import { IComponents } from "@bluelibs/x-ui";

declare module "@bluelibs/x-ui" {
  export interface IComponents {
    AdminTopHeader: React.ComponentType;
    AdminMenu: React.ComponentType;
    AdminContent: React.ComponentType;
    AdminFooter: React.ComponentType;
    AdminLoading: React.ComponentType;
    AdminPageWrapper: React.ComponentType<Components.PageWrapperProps>;
    AdminPublicLayout: React.ComponentType;
    AdminLayout: React.ComponentType;
    AdminLogo: React.ComponentType;
    AdminFilesUpload: React.ComponentType<Components.AdminFilesUploadProps>;
    AdminFileUpload: React.ComponentType<Components.AdminFileUploadProps>;
    AdminFileGroupUpload: React.ComponentType<
      Components.AdminFileGroupUploadProps
    >;
    AdminListItemRenderer: React.ComponentType<
      Components.AdminListItemRendererProps
    >;
    DatePicker: React.ComponentType<Components.DatePickerProps>;
    RemoteSelect: React.ComponentType<Components.RemoteSelectProps>;
    RemoteSelectLazy: React.ComponentType<Components.RemoteSelectLazyProps>;
  }
}

export const DefaultComponentsMap: Partial<IComponents> = {
  AdminPublicLayout: Components.PublicLayout,
  AdminLayout: Components.AdminLayout,
  AdminContent: Components.AdminContent,
  AdminTopHeader: Components.AdminTopHeader,
  AdminMenu: Components.AdminMenu,
  AdminFooter: Components.AdminFooter,
  AdminLoading: Components.AdminLoading,
  AdminPageWrapper: Components.AdminPageWrapper,
  AdminLogo: Components.AdminLogo,
  AdminFilesUpload: Components.AdminFilesUpload,
  AdminFileUpload: Components.AdminFileUpload,
  AdminFileGroupUpload: Components.AdminFileGroupUpload,
  AdminListItemRenderer: Components.AdminListItemRenderer,
  DatePicker: Components.DatePicker,
  RemoteSelect: Components.RemoteSelect,
  RemoteSelectLazy: Components.RemoteSelectLazy,
};
