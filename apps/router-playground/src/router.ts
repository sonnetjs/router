import {
  RouteObject,
  createBrowserHistory,
  createRouter,
} from '@sonnetjs/router';

import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';

import RootComponent from './partials/Layout';

const routes: RouteObject[] = [
  {
    rootComponent: RootComponent,
    children: [
      { path: '/', component: Home },
      { path: '/about', component: About },
      { path: '/contact', component: Contact },
    ],
  },
];

const history = createBrowserHistory();

export const router = createRouter({
  routes,
  history,
});
