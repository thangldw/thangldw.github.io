import { cpSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(root, "../..");
if (!existsSync(path.join(pages, "js/support-dialog.js"))) throw new Error("Expected the portfolio Pages checkout");
const target = path.join(pages, "apps/japan-pr-guide");
mkdirSync(target, { recursive: true });
// Keep previous hashed assets so cached HTML remains valid during Pages propagation.
cpSync(path.join(root, "dist/client"), target, { recursive: true });
const index = path.join(target, "index.html");
const shell = `    <link rel="stylesheet" href="/css/icons.css?v=20260714" />\n    <link rel="stylesheet" href="/css/support-dialog.css?v=20260803i" />\n    <script defer src="/js/support-dialog.js?v=20260803e"></script>\n`;
writeFileSync(index, readFileSync(index, "utf8").replace("  </head>", `${shell}  </head>`));
console.log(`Generated Pages app: ${target}`);
