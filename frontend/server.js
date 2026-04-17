import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import QRCode from "qrcode";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || "http://localhost:5000";
const _apiUrl = new URL(API_URL);
const API_HOSTNAME = _apiUrl.hostname;
const useHttps = _apiUrl.protocol === "https:";
const defaultPort = useHttps ? 443 : 80;
const API_PORT = _apiUrl.port ? parseInt(_apiUrl.port, 10) : defaultPort;
const proxyClient = useHttps ? https : http;
const proxyHostHeader =
  API_PORT === defaultPort ? API_HOSTNAME : `${API_HOSTNAME}:${API_PORT}`;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "application/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

function resolveHtmlFile(pathname) {
  if (pathname === "/" || pathname === "") return "index.html";
  if (pathname.startsWith("/menu")) return "menu.html";
  if (pathname.startsWith("/order")) return "order.html";
  if (pathname === "/kitchen/login") return "login.html";
  if (pathname === "/kitchen") return "kitchen.html";
  if (pathname === "/admin/login") return "login.html";
  if (pathname === "/login") return "login.html";
  if (pathname === "/admin/menu") return "admin-menu.html";
  if (pathname === "/admin/tables") return "admin-tables.html";
  if (pathname === "/admin/reports") return "admin-reports.html";
  if (pathname === "/admin") return "admin.html";
  return null;
}

function resolveStaticFile(pathname) {
  // JS files: auth.js lives in components, rest in api
  if (pathname.startsWith("/js/")) {
    const filename = pathname.slice(4);
    const componentPath = path.join(__dirname, "src/components", filename);
    if (fs.existsSync(componentPath)) return componentPath;
    return path.join(__dirname, "src/api", filename);
  }
  // Everything else (CSS, images, favicon) from public/
  return path.join(__dirname, "public", pathname);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost`);

  // QR code generation
  if (url.pathname === "/qr") {
    const qrUrl = url.searchParams.get("url");
    if (!qrUrl) { res.writeHead(400); res.end("Missing url param"); return; }
    QRCode.toBuffer(qrUrl, { width: 200, margin: 2, color: { dark: "#1a0f00", light: "#fffff7" } }, (err, buf) => {
      if (err) { res.writeHead(500); res.end("QR Error"); return; }
      res.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" });
      res.end(buf);
    });
    return;
  }

  // Proxy /api/ and /uploads/ to the backend
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/uploads/")) {
    const options = {
      hostname: API_HOSTNAME,
      port: API_PORT,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: proxyHostHeader },
    };
    const proxyReq = proxyClient.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on("error", () => {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "API server unavailable" }));
    });
    req.pipe(proxyReq);
    return;
  }

  // Static assets (JS, CSS, images)
  const ext = path.extname(url.pathname);
  if (ext) {
    const filePath = resolveStaticFile(url.pathname);
    const contentType = MIME[ext] || "application/octet-stream";
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end("Not Found"); }
      else { res.writeHead(200, { "Content-Type": contentType }); res.end(data); }
    });
    return;
  }

  // HTML pages
  const htmlFile = resolveHtmlFile(url.pathname);
  if (!htmlFile) {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>404 Not Found</h1>");
    return;
  }

  const filePath = path.join(__dirname, "src/pages", htmlFile);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(500); res.end("Server Error"); }
    else { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(data); }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Restaurant frontend running on http://0.0.0.0:${PORT}`);
});
