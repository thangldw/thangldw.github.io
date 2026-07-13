# thangldw.github.io

Portfolio and browser-native product demos published at [thangldw.github.io](https://thangldw.github.io/).

## Main routes

- [Home](https://thangldw.github.io/) and [Japanese profile](https://thangldw.github.io/ja/)
- [Apps catalog](https://thangldw.github.io/apps/)
- [Data Copilot](https://thangldw.github.io/apps/data-copilot/) and [Pipeline Observability](https://thangldw.github.io/apps/pipeline/)
- [RAGOps case study](https://thangldw.github.io/projects/ragops/)

The canonical JLPT routes are documented in [`apps/URL-MIGRATION.md`](apps/URL-MIGRATION.md). Previous Japanese-app URLs remain as redirects so existing bookmarks keep working.

## Local preview

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/`.

## Release without CI

GitHub Pages is configured in legacy branch mode from `master` at the repository root. A direct push publishes the static files without requiring the project workflows:

```bash
git push origin master
```

Release commits use `[skip ci]`. Stable source snapshots are also published as GitHub Releases, which does not require a workflow run.
