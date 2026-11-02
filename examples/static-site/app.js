// Theme: a stored choice wins over the system setting.
const stored = localStorage.getItem('theme');
if (stored) document.documentElement.dataset.theme = stored;

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('theme-toggle');
  toggle.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme === 'dark' ||
      (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
  });

  // Menu button (phones).
  const button = document.getElementById('menu-button');
  const nav = document.getElementById('main-nav');
  const setOpen = (open) => {
    nav.classList.toggle('open', open);
    button.setAttribute('aria-expanded', String(open));
  };
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); button.focus(); }
  });

  // Newsletter dialog.
  const opener = document.getElementById('subscribe');
  const dialog = document.getElementById('subscribe-dialog');
  if (opener && dialog) {
    opener.addEventListener('click', () => dialog.showModal());
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  }
});
