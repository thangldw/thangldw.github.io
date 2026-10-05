import { cpSync, mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(root, "../..");
if (!existsSync(path.join(pages, "js/support-dialog.js"))) throw new Error("Expected the portfolio Pages checkout");
const target = path.join(pages, "japan-pr-guide");
mkdirSync(target, { recursive: true });
// Keep previous hashed assets so cached HTML remains valid during Pages propagation.
cpSync(path.join(root, "dist/client"), target, { recursive: true });
// Preserve the published font loading policy when rebuilding the route.
for (const name of readdirSync(path.join(target, "assets"))) {
  if (!name.endsWith(".css")) continue;
  const css = path.join(target, "assets", name);
  writeFileSync(css, readFileSync(css, "utf8").replaceAll("font-display:swap", "font-display:optional"));
}
const index = path.join(target, "index.html");
const shell = `    <link rel="stylesheet" href="/css/icons.css?v=20260714" />\n    <link rel="stylesheet" href="/css/support-dialog.css?v=20260803i" />\n    <script defer src="/js/support-dialog.js?v=20261005route"></script>\n`;
writeFileSync(index, readFileSync(index, "utf8").replace("  </head>", `${shell}  </head>`));
console.log(`Generated Pages app: ${target}`);

const legacy = path.join(pages, "apps/japan-pr-guide");
mkdirSync(legacy, { recursive: true });
writeFileSync(path.join(legacy, "index.html"), `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Japan PR Guide — moved</title>
  <link rel="canonical" href="https://thangldw.github.io/japan-pr-guide/" />
  <meta http-equiv="refresh" content="0; url=/japan-pr-guide/" />
  <script>location.replace("/japan-pr-guide/" + location.search + location.hash);</script>
</head>
<body><p><a href="/japan-pr-guide/">Open Japan PR Guide</a></p></body>
</html>
`);
