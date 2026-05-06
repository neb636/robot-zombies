/**
 * Audio asset URL maps. Music and SFX are not yet produced (see tasks.md);
 * AudioManager resolves URLs by key — when files exist, this glob will pick
 * them up automatically (Vite re-runs `import.meta.glob` on file changes).
 */
const MUSIC_GLOBS = import.meta.glob<string>('./music/*.ogg', {
  eager: true,
  query: '?url',
  import: 'default',
});

const SFX_GLOBS = import.meta.glob<string>('./sfx/*.ogg', {
  eager: true,
  query: '?url',
  import: 'default',
});

function buildMap(globs: Record<string, string>, dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, url] of Object.entries(globs)) {
    const re = new RegExp(`^\\.\\/${dir}\\/(.+)\\.ogg$`);
    const m = path.match(re);
    if (m && m[1]) out[m[1]] = url;
  }
  return out;
}

export const MUSIC_URLS: Record<string, string> = buildMap(MUSIC_GLOBS, 'music');
export const SFX_URLS:   Record<string, string> = buildMap(SFX_GLOBS, 'sfx');
