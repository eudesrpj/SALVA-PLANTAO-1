import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

/**
 * Detecta se é asset estático (para não cair no fallback SPA)
 */
function isStaticAsset(url: string) {
  return (
    url.startsWith("/assets/") ||
    url.startsWith("/favicon") ||
    url.startsWith("/robots.txt") ||
    url.startsWith("/manifest") ||
    url.startsWith("/icons/") ||
    url.endsWith(".js") ||
    url.endsWith(".css") ||
    url.endsWith(".map") ||
    url.endsWith(".png") ||
    url.endsWith(".jpg") ||
    url.endsWith(".jpeg") ||
    url.endsWith(".svg") ||
    url.endsWith(".ico") ||
    url.endsWith(".webp") ||
    url.endsWith(".txt")
  );
}

export async function setupVite(server: Server, app: Express) {
  const serverOptions = {
    middlewareMode: true,
    hmr: false, // Desabilitar HMR automático que está causando erro
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  // Middlewares do Vite (HMR, transforms, assets)
  app.use(vite.middlewares);

  // 🧠 SPA fallback (DEV)
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    // Backend responde essas rotas
    if (url.startsWith("/api") || url.startsWith("/health")) return next();

    // Vite cuida disso
    if (url.startsWith("/vite-hmr") || isStaticAsset(url)) return next();

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // Sempre recarrega o HTML (dev)
      let template = await fs.promises.readFile(clientTemplate, "utf-8");

      // Bust de cache do entrypoint
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );

      const html = await vite.transformIndexHtml(url, template);

      res
        .status(200)
        .setHeader("Content-Type", "text/html")
        .end(html);
    } catch (err) {
      vite.ssrFixStacktrace(err as Error);
      next(err);
    }
  });
}
