import { Action, To } from './history';

export class LinkEvent {
  a: NodeListOf<HTMLAnchorElement> | null;
  static navigate: (to: number | To, action?: Action) => void;

  constructor() {
    this.a = null;
  }

  init(navigate: (to: number | To, action?: Action) => void) {
    this.a = document.querySelectorAll('a');
    LinkEvent.navigate = navigate;
  }

  handleClick(event: MouseEvent) {
    event.preventDefault();
    const href = (event.target as HTMLAnchorElement).href;
    LinkEvent.navigate(href);
  }

  public addListener() {
    this.a?.forEach((link) => {
      link.addEventListener('click', this.handleClick);
    });
  }

  public removeListener() {
    this.a?.forEach((link) => {
      link.addEventListener('click', this.handleClick);
    });
  }
}
