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

  // SPA fallback — MAS NUNCA PARA /api OU /health
  app.use("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
      return next();
    }

    // Check if file exists in dist before serving index.html
    const filePath = path.join(distPath, req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return next();
    }

    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
