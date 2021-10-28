import * as React from "react";
import { Route, Router, Switch } from "react-router-dom";
import * as queryString from "query-string";
import { XRouter } from "./XRouter";
import { useUIComponents } from "@bluelibs/x-ui-react-bundle";

interface IProps {
  router: XRouter;
}

export const XBrowserRouter: React.FC<IProps> = (props) => {
  const Components = useUIComponents();

  const { router } = props;

  return (
    <Router history={router.history}>
      <Switch>
        {router.store.map((route, idx) => {
          const { component, ...cleanedRoute } = route;

          // In case the route contains a custom render we render the route normally
          if (cleanedRoute.render) {
            return <Route key={idx} {...route} />;
          }

          return (
            <Route
              key={idx}
              {...cleanedRoute}
              render={({ match, location }) => {
                const elementProps = {
                  ...match.params,
                  queryVariables: location.search
                    ? queryString.parse(location.search)
                    : {},
                };

                if (route.roles) {
                  return (
                    <Components.ErrorBoundary>
                      {/* // TODO: fix type definition, modified by x-ui-guardian-bundle */}
                      {React.createElement((Components as any).Protect, {
                        roles: route.roles,
                        component,
                        componentProps: elementProps,
                      })}
                    </Components.ErrorBoundary>
                  );
                }

                return React.createElement(component, elementProps);
              }}
            />
          );
        })}
        <Route path="*" component={Components.NotFound} />
      </Switch>
    </Router>
  );
};
