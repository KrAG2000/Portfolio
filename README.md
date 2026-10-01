# Kartik Agnihotri — Portfolio

A static portfolio hosted on GitHub Pages. The homepage and chapter pages load their visible content from JSON files; shared HTML, CSS and JavaScript render the pages.

## Visit the site

- Published site: `https://krag2000.github.io/Portfolio/`
- Homepage locally: start the server below and visit `http://localhost:8000/`.
- A chapter locally: `http://localhost:8000/chapter.html?id=v1` (use the chapter `id` from its JSON file).

Opening `index.html` directly from your file manager will not work because browsers block JSON fetches from `file://` URLs.

## Preview locally

From the repository root:

```sh
python3 -m http.server 8000
```

## Publish with GitHub Pages

Push the repository to GitHub. In **Settings → Pages**, choose **Deploy from a branch**, select the publishing branch and choose `/ (root)`.

## Content files

- `config/home.json` contains the homepage page title, description and body markup. Its optional `resume` field points to the single résumé link shown on the homepage.
- `config/chapters/manifest.json` lists chapter JSON filenames in display order. Set `current: true` on the chapter to feature it at the top of the archive.
- `chapters/<id>.json` contains a chapter's metadata and page markup. Its `id` determines the chapter URL: `chapter.html?id=<id>`.

### Add a chapter

1. Add `chapters/<id>.json`, following the structure of an existing chapter file. Give it a unique `id` and fill in the page markup in `html`.
2. Add its filename to `config/chapters/manifest.json`; choose its order and whether it is current.
3. Preview the homepage and `chapter.html?id=<id>` locally.

The chapter template and interaction scripts are shared. Chapter page markup lives in the JSON `html` field. Each chapter's `animation.html` contains its homepage animation as regular HTML. Shared `animations.css` styles the nodes and transitions, and `animation.js` advances the active step. Use this same HTML/CSS/JS pattern for chapter work-card diagrams. No SVG or GIF animation assets are needed.

The JSON markup is authored by the site owner and inserted as HTML. Keep it trusted; do not put untrusted visitor input in these files.

## Code quality checks

This is a static site, but the source is checked before it is pushed and again by GitHub Actions.

Install the locked tools and enable the local Git hook:

```sh
npm ci
```

`npm ci` installs only the dependency versions recorded in `package-lock.json`. The package `prepare` step installs Husky's Git hook for this checkout. Before every `git push` to any remote, the hook runs `npm run check` and blocks the push if a check fails.

Run the same pipeline yourself:

```sh
npm run check
```

It checks Prettier formatting, JavaScript with ESLint, CSS with Stylelint, JavaScript types with TypeScript, JSON/chapter manifests and local links, and installed dependencies. `npm run format` fixes formatting; rerun `npm run check` before pushing.

GitHub Actions runs the checks on every push and pull request. To make GitHub reject changes to `main` until the hosted checks pass, open **Settings → Rules → Rulesets** (or **Settings → Branches**), protect `main`, require pull requests, and require the status check named **quality / required checks**. This server-side rule is what prevents someone from bypassing a local hook. Local Git hooks can be skipped with Git's `--no-verify` option or by disabling Husky.
