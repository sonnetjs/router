import { $component, SonnetComponent } from '@sonnetjs/core';
import { header } from './partials/header';

class App extends SonnetComponent {
  static script(): void {
    console.log('App script');
  }

  public get() {
    return /*html */ `
    ${header()}
    ${this._children}
    `;
  }
}

export default $component(App);
