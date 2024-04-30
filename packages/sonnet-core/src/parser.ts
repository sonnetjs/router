import { match } from 'path-to-regexp';
import type { IndexedRoutesObject, RouteObject } from './router';

/**
 * Normalizes the routes by assigning unique IDs and parent IDs to each route.
 * @param routes - The array of route objects to be normalized.
 * @param parentPath - The parent path of the current route.
 * @param parentIds - The array of parent IDs of the current route.
 * @returns An object containing the normalized routes with assigned IDs and parent IDs.
 */
export function normalizedRoutes(
  routes: RouteObject[],
  parentPath = '',
  parentIds: number[] = [],
): IndexedRoutesObject {
  let id = 0;

  const dataRoutes: IndexedRoutesObject = {};

  for (const route of routes) {
    const treePath = [...parentIds, id];

    const path = `${parentPath}${route.path || ''}`;

    if (route.children) {
      const childrenRoute = [...route.children];
      const parentId =
        parentIds.length + parentIds.reduce((acc, cur) => acc + cur, 0) + id;

      delete route.children;

      dataRoutes[id++] = { ...route, path };

      const children = normalizedRoutes(childrenRoute, path, treePath);

      for (const key in children) {
        dataRoutes[id] = children[key];
        if (!dataRoutes[id].parentId) {
          dataRoutes[id].parentId = parentId;
        }
        id++;
      }

      continue;
    }

    dataRoutes[id++] = { ...route, path };
  }

  return dataRoutes;
}

/**
 * Returns a function that matches a given path against the indexed routes and returns an array of matched routes.
 * @param indexedRoutes - The indexed routes object.
 * @returns A function that takes a path and returns an array of matched routes.
 */
export function matcher(
  indexedRoutes: IndexedRoutesObject,
): (path: string) => RouteObject[] {
  return (path: string): RouteObject[] => {
    const matchedRoutes: RouteObject[] = [];

    for (const key in indexedRoutes) {
      const route = indexedRoutes[key];
      if (!route.path) continue;

      const matchRoute = match(route.path, { decode: decodeURIComponent });

      const result = matchRoute(path);

      if (result) {
        if (route.parentId !== undefined) {
          const parents = traverseParents(indexedRoutes, route.parentId);
          matchedRoutes.push(...parents.reverse());
        }
        const currentRoute = {
          ...indexedRoutes[key],
          params: { ...result.params },
        };
        delete currentRoute.parentId;
        matchedRoutes.push(currentRoute);
        break;
      }
    }

    return matchedRoutes;
  };
}

/**
 * Traverses the parents of a route in the indexedRoutes object and returns an array of parent routes.
 * @param indexedRoutes - The indexed routes object.
 * @param parentId - The ID of the parent route.
 * @returns An array of parent routes.
 */
function traverseParents(
  indexedRoutes: IndexedRoutesObject,
  parentId?: number,
): RouteObject[] {
  const parents: RouteObject[] = [];

  if (parentId !== undefined) {
    const parentRoute = indexedRoutes[parentId];
    if (parentRoute) {
      parents.push(parentRoute);
      const parentParents = traverseParents(
        indexedRoutes,
        parentRoute.parentId,
      );
      if (parentParents.length > 0) {
        parents.push(...parentParents);
      }
    }
  }

  return parents;
}
