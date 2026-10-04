# rgitweb

A fully static, client-side Git repository browser — a cgit replacement with
no server-side rendering at all.

Point it at the URL of a Git repository hosted as static files (the dumb-HTTP
layout maintained by `git update-server-info`) to browse code, branches, tags,
history, and commit details—entirely in the browser.

## How it works

The app uses exactly the same data as a dumb-HTTP `git clone` would read, but
only as necessary. It uses pack file `.idx` indexes to locate packed objects,
and makes HTTP Range requests to fetch just that object's bytes from the
`.pack`. Packs are immutable, so caching is handled natively by the browser.

## Hosting requirements for browsed repositories

- A bare repository served as static files, with `git update-server-info`
  run after each update (see `.git/hooks/post-update.sample ` for how to do
  this automatically).
- If `rgitweb` is not on the same origin as the repository, the repo must
  be served with suitable CORS headers allowing the browsing origin, exposing `Accept-Ranges` and `Content-Range`.
- For efficiency, the server should support Range requests; without it the app
  falls back to fetching the entire pack file into memory at once.

## Development

```sh
npm install
npm run dev       # local dev server
npm test          # Jest; fixtures are built with the real git CLI
npm run lint:fix  # ESLint (includes formatting)
npm run build     # static site in dist/
```

See `ARCHITECTURE.md` for architecture notes and conventions.

## Configuration

There are a few UI options that can be dynamically configured with a JSON
file loaded at runtime. To enable this feature, set `VITE_CONFIG_PATH` at
build time to a (possibly relative) URL path to this JSON file. If this
variable is unset during the build, the app does not fetch a config. See
`src/ui/config.ts` for documentation on configuration options.

## History

This repository was forked from https://github.com/andrewaylett/rgitweb,
which appears to have been largely or entirely AI-generated in a single
commit. That code mostly worked, though the UI was a bit weird and there
were some half-baked features that have been removed.

The UI has subsequently been significantly reworked; the original `src/git`
has largely been left alone since for the most part it seems to work fine
as-is.

## Example deployment

This fork can be seen in action at https://src.wolfgangfaust.com/browse/#/r/%2Frgitweb.git

The upstream project has a demo available at https://andrewaylett.github.io/rgitweb/#/r/https%3A%2F%2Fandrewaylett.github.io%2Frgitweb%2Fgit/summary
