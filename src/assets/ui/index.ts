import loadScreenUrl from './load-screen.png';

export const UI_LOAD_SCREEN_URL = loadScreenUrl;

const ICON_GLOBS = import.meta.glob<string>('./icons/**/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

/** Map of `<category>/<name>` (filename without extension) → URL. */
export const UI_ICON_URLS: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const [path, url] of Object.entries(ICON_GLOBS)) {
    const m = path.match(/\.\/icons\/(.+)\.png$/);
    if (m && m[1]) out[m[1]] = url;
  }
  return out;
})();
