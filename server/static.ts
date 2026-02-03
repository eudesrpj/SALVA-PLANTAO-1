import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Procurar em dist/public relative to working directory
  const distPath = path.resolve(process.cwd(), "dist", "public");

  if (!fs.existsSync(distPath)) {
    console.warn(
      `⚠️  Build directory not found: ${distPath}. SPA fallback disabled.`,
    );
    return;
  }

  // arquivos estáticos (js, css, assets)
  app.use(express.static(distPath));

  // SPA fallback — MAS NUNCA PARA /api, /health, /_debug
  app.use("*", (req, res, next) => {
    // Skip API, health checks, and debug endpoints
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/health") ||
      req.path.startsWith("/_debug")
    ) {
      return next();
    }

    // Check if file exists in dist before serving index.html
    const filePath = path.join(distPath, req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return next();
    }

    // Serve SPA fallback only for actual app routes
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
