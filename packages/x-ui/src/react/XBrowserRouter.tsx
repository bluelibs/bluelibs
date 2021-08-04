import * as React from "react";
import { Route, Router, Switch } from "react-router-dom";
import * as queryString from "query-string";
import { XRouter } from "./XRouter";
import { useUIComponents } from "./hooks/useUIComponents";
import { NotFound } from "./components/NotFound";

interface IProps {
  router: XRouter;
}

export const XBrowserRouter = ({ router }: IProps) => {
  const Components = useUIComponents();

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
                      {React.createElement(Components.Protect, {
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
