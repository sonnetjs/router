import { SonnetApp, SonnetComponent } from '@sonnetjs/core';
import { Action, History, Location, To } from './history';
import { matcher, normalizedRoutes } from './parser';
import { LinkEvent } from './dom';

type RouteOptions = {
  routes: RouteObject[];
  history: History;
  window?: Window;
  mountedId?: string;
};

type Router = {
  options: RouteOptions;
  state: RouterState;
  routes: RouteObject[];
  indexedRoutes: IndexedRoutesObject;
  window?: Window;
  subscribe: (fn: RouterSubscriber) => () => void;
  install: (app: SonnetApp) => void;
  uninstall: () => void;
  navigate: (to: number | To, action?: Action) => void;
};

export type BaseRouteObject = {
  id?: number;
  path?: string;
  sensitive?: boolean;
  params?: Record<string, string>;
  component?: () => Promise<SonnetComponent> | SonnetComponent;
  rootComponent?: () => Promise<SonnetComponent> | SonnetComponent;
};

export type IndexedRoutesObject = Record<
  number,
  BaseRouteObject & { parentId?: number }
>;

export type RouteObject = BaseRouteObject & {
  children?: RouteObject[];
};

export type DataRouteObject = BaseRouteObject & {
  id: number;
  children?: RouteObject[];
};

export interface RouterSubscriber {
  (state: RouterState): void;
}

type RouterState = {
  historyAction: Action;
  location: Location;
  initialized: boolean;
  matches: RouteObject[] | undefined;
};

export function createRouter(options: RouteOptions): Router {
  const routerWindow = options.window
    ? options.window
    : typeof window !== 'undefined'
      ? window
      : undefined;

  const indexedRoutes = normalizedRoutes(options.routes);

  const matches = matcher(indexedRoutes);

  let state: RouterState = {
    historyAction: options.history.action,
    location: options.history.location,
    matches: undefined,
    initialized: false,
  };

  let unsubscribe: () => void;

  let isAppRoot = false;
  let isFirstMounted = false;

  function install(app: SonnetApp) {
    if (state.initialized) return;
    app.lazy(false);

    unsubscribe = subscribe(async () => {
      if (!app) return;
      const matches = state.matches;

      if (!matches) return;

      const lastMatch = matches[matches.length - 1];
      const rootComponent = [...matches]
        .reverse()
        .find((match) => match.rootComponent)?.rootComponent;

      if (lastMatch.component) {
        const matchingComponent = await lastMatch.component();

        if (app.component && !isFirstMounted) {
          isAppRoot = true;
        }
        if (!isAppRoot && options.mountedId) {
          console.warn(
            "Mounted id doesn't have any impact because the app root is not set.",
            'set app.root(App) in your app component.',
          );
        }

        if (app.component && isAppRoot) {
          if (options.mountedId && isFirstMounted) {
            if (rootComponent) {
              const initRoot = await rootComponent();
              app.root(() => initRoot, {
                _children: matchingComponent.get(),
              });
            } else {
              app.root(() => matchingComponent);
            }
          } else {
            if (rootComponent) {
              const initRoot = (await rootComponent())
                .children(matchingComponent.get())
                .get();
              app.root(app.component, {
                _children: initRoot,
              });
            } else {
              app.root(app.component, {
                _children: matchingComponent.get(),
              });
            }
          }
        } else {
          isAppRoot = false;
          if (rootComponent) {
            const initRoot = await rootComponent();
            app.root(() => initRoot, {
              _children: matchingComponent.get(),
            });
          } else {
            app.root(() => matchingComponent);
          }
        }
      }
      if (options.mountedId && isFirstMounted && isAppRoot) {
        app.unmount();
        app.mount(options.mountedId);
      } else {
        isFirstMounted && app.unmount();
        app.mount(app.mountedId);
      }
    });

    const linkEvent = new LinkEvent();

    app.on('mount', () => {
      linkEvent.init(navigate);
      linkEvent.addListener();

      isFirstMounted = true;
    });

    app.on('unmount', () => {
      linkEvent.removeListener();
    });

    navigate(options.history.location.pathname);

    state.initialized = true;
  }

  function uninstall() {
    if (unsubscribe) {
      unsubscribe();
    }
    subscribers.clear();
  }

  const subscribers = new Set<RouterSubscriber>();

  function subscribe(fn: RouterSubscriber) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  }

  function updateState(newState: Partial<RouterState>): void {
    state = {
      ...state,
      ...newState,
    };

    [...subscribers].forEach((subscriber) => subscriber(state));
  }

  function navigate(to: number | To, action: Action = Action.Push): void {
    if (typeof to === 'number') {
      options.history.go(to);
    } else if (action === Action.Push) {
      options.history.push(to);
    } else if (action === Action.Replace) {
      options.history.replace(to);
    }

    updateState({
      historyAction: action,
      location: options.history.location,
      matches: matches(options.history.location.pathname),
    });
  }

  return {
    get state() {
      return state;
    },
    get window() {
      return routerWindow;
    },
    routes: options.routes,
    indexedRoutes,
    install,
    uninstall,
    options,
    subscribe,
    navigate,
  };
}
