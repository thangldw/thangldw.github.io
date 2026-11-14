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
// Keep the site font loading policy (swap) when rebuilding the route.
for (const name of readdirSync(path.join(target, "assets"))) {
  if (!name.endsWith(".css")) continue;
  const css = path.join(target, "assets", name);
  writeFileSync(css, readFileSync(css, "utf8").replaceAll("font-display:optional", "font-display:swap"));
}
const index = path.join(target, "index.html");
const shell = `    <link rel="stylesheet" href="/css/icons.css?v=20260714" />\n    <link rel="stylesheet" href="/css/support-dialog.css?v=20261105-qr" />\n    <script defer src="/js/support-dialog.js?v=20261106-i18n"></script>\n`;
writeFileSync(index, readFileSync(index, "utf8").replace("  </head>", `${shell}  </head>`));
console.log(`Generated Pages app: ${target}`);
