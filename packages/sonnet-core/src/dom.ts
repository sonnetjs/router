export function preventLink(
  navigate: (href: string) => void,
  routerWindow?: Window,
) {
  if (!routerWindow) {
    throw new Error('Window is undefined');
  }
  const a = routerWindow.document.querySelectorAll('a[data-link="prevent"]');

  a.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();

      const href = link.getAttribute('href');

      navigate(href as string);
    });
  });
}
