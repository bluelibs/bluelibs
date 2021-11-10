export * from "@bluelibs/x-ui-guardian-bundle";
export * from "@bluelibs/x-ui-react-bundle";
export * from "@bluelibs/x-ui-session-bundle";
export * from "@bluelibs/x-ui-i18n-bundle";
export * from "@bluelibs/x-ui-react-router-bundle";
export * from "@bluelibs/x-ui-collections-bundle";
export * from "@bluelibs/ui-apollo-bundle";

export * from "./XUIBundle";
export * from "./defs";

import { IReactRoute } from "@bluelibs/x-ui-react-router-bundle";
/**
 * We use `IRoute` here for compatibility reasons
 */
export interface IRoute extends IReactRoute {}

// /**
//  * The code below is designed to offer backwards compatibility
//  * We recommend that interface extension should be done on `@bluelibs/x-ui-react-bundle` and not here
//  */
// import {
//   IComponents as IBaseComponents,
//   useUIComponents as useBaseUIComponents,
// } from "@bluelibs/x-ui-react-bundle";

// export interface IComponents extends IBaseComponents {}

// export function useUIComponents(): IComponents {
//   return useBaseUIComponents();
// }
