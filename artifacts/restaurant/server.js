import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import QRCode from "qrcode";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8081;
const API_PORT = 8080;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "application/javascript",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

function resolveHtmlFile(pathname) {
  if (pathname === "/" || pathname === "") return "index.html";
  if (pathname.startsWith("/menu")) return "menu.html";
  if (pathname.startsWith("/order")) return "order.html";
  if (pathname === "/kitchen") return "kitchen.html";
  if (pathname === "/admin/menu") return "admin-menu.html";
  if (pathname === "/admin/tables") return "admin-tables.html";
  if (pathname === "/admin") return "admin.html";
  return null;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost`);

  // QR code generation endpoint
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

  if (url.pathname.startsWith("/api/")) {
    const options = {
      hostname: "localhost",
      port: API_PORT,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `localhost:${API_PORT}` },
    };
    const proxyReq = http.request(options, (proxyRes) => {
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

  const ext = path.extname(url.pathname);
  if (ext) {
    const filePath = path.join(__dirname, "public", url.pathname);
    const contentType = MIME[ext] || "application/octet-stream";
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not Found");
      } else {
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
      }
    });
    return;
  }

  const htmlFile = resolveHtmlFile(url.pathname);
  if (!htmlFile) {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>404 Not Found</h1>");
    return;
  }

  const filePath = path.join(__dirname, "public", htmlFile);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end("Server Error");
    } else {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(data);
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Restaurant frontend running on http://0.0.0.0:${PORT}`);
});
