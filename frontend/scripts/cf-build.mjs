import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");
const pagesDir = path.join(root, "src", "pages");
const publicDir = path.join(root, "public");

const raw = process.env.PUBLIC_API_URL || process.env.API_URL || "";
const normalized = String(raw).trim().replace(/\/$/, "");
const configJs = `window.__API_BASE__=${JSON.stringify(normalized)};\n`;

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

fs.cpSync(publicDir, dist, { recursive: true });
fs.writeFileSync(path.join(dist, "config.js"), configJs);

for (const f of fs.readdirSync(pagesDir)) {
  if (!f.endsWith(".html")) continue;
  fs.copyFileSync(path.join(pagesDir, f), path.join(dist, f));
}

const jsOut = path.join(dist, "js");
fs.mkdirSync(jsOut, { recursive: true });
for (const dir of [path.join(root, "src", "api"), path.join(root, "src", "components")]) {
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".js")) continue;
    fs.copyFileSync(path.join(dir, f), path.join(jsOut, f));
  }
}

console.log("Built frontend to", dist, normalized ? `(API base: ${normalized})` : "(API base: same-origin)");
