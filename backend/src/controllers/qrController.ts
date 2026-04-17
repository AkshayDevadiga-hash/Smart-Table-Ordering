import type { Request, Response } from "express";
import QRCode from "qrcode";

export async function qrPng(req: Request, res: Response): Promise<void> {
  const url = typeof req.query.url === "string" ? req.query.url : "";
  if (!url) {
    res.status(400).send("Missing url param");
    return;
  }
  try {
    const buf = await QRCode.toBuffer(url, {
      width: 200,
      margin: 2,
      color: { dark: "#1a0f00", light: "#fffff7" },
    });
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(buf);
  } catch {
    res.status(500).send("QR Error");
  }
}
