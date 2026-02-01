import "dotenv/config";

/*
© Salva Plantão
Uso não autorizado é proibido.
Contato oficial: suporte@appsalvaplantao.com
*/

import express, { type Request, Response, NextFunction } from "express";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { setupWebSocket } from "./websocket";

const app = express();
const httpServer = createServer(app);

// Em CommonJS (build), import.meta.url é undefined, então usamos process.cwd()
const __dirname = import.meta?.url 
  ? path.dirname(fileURLToPath(import.meta.url))
  : __dirname || process.cwd();

const appName = process.env.APP_NAME || "Salva Plantão";
const appVersion = (() => {
  try {
    // Em produção (CommonJS), __dirname aponta para dist/, então package.json está em ../
    // Em dev (ESM), __dirname aponta para server/, então package.json está em ../
    const packageJsonPath = path.resolve(__dirname, "..", "package.json");
    const raw = readFileSync(packageJsonPath, "utf-8");
    const parsed = JSON.parse(raw);
    return parsed?.version || "1.0.0";
  } catch (err) {
    console.warn("[WARN] Could not read package.json:", err);
    return process.env.APP_VERSION || "1.0.0";
  }
})();

const buildCommit = (process.env.BUILD_SHA || process.env.COMMIT_SHA || process.env.GIT_SHA || "unknown").split(" ")[0];
const buildTime = process.env.BUILD_TIME || "unknown";

app.set("trust proxy", 1);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Não fazer exit em dev para não quebrar o servidor
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Não fazer exit em dev para não quebrar o servidor
});

// Setup WebSocket server for real-time notifications
setupWebSocket(httpServer);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// CORS middleware
app.use((req, res, next) => {
  // Allow any origin to make requests with cookies
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
  res.setHeader("Access-Control-Expose-Headers", "Set-Cookie");
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Health check endpoint - FIRST MIDDLEWARE, before anything else
app.get("/health", (_req, res) => {
  console.log("[DEBUG] /health endpoint called");
  res.setHeader("Content-Type", "application/json");
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    auth: "independent",
    node: process.version,
  });
});

app.get("/api/health", (req, res) => {
  console.log("[DEBUG] /api/health endpoint called");
  const apiBaseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
  res.setHeader("Content-Type", "application/json");
  res.json({
    appName,
    version: appVersion,
    gitCommit: buildCommit,
    buildTime,
    serverTime: new Date().toISOString(),
    apiBaseUrl,
  });
});

// DEBUG: Listen state endpoint (PASSO 3)
let serverInstance: any = null;
app.get("/_debug/listen", (_req, res) => {
  try {
    const addr = serverInstance?.address?.() || "unknown";
    res.setHeader("Content-Type", "application/json");
    res.json({
      pid: process.pid,
      port: parseInt(process.env.PORT || "5000", 10),
      envPort: process.env.PORT || null,
      address: addr,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}


console.log("Iniciando servidor...");

// Wrap in async IIFE to support await in CJS
(async () => {
  // Register ALL API routes FIRST, before any static serving
  try {
    await registerRoutes(httpServer, app);
    console.log("[DEBUG] Routes registered successfully");
  } catch (error) {
    console.error("[ERROR] Failed to register routes:", error);
    process.exit(1);
  }

  // Setup static file serving AFTER all API routes
  try {
    serveStatic(app);
    console.log("[DEBUG] Static file configuration complete");
  } catch (error) {
    console.error("[WARNING] Failed to configure static files:", error);
  }

  // Setup error handler LAST
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("[DEBUG] Error handler invoked:", err);
    
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // ===== DIRECT LISTEN (proven working pattern) =====
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = "0.0.0.0";

  console.log("[DEBUG] About to call httpServer.listen...");

  // Setup error handlers BEFORE listening
  httpServer.on('error', (error: any) => {
    console.error('[CRITICAL] HTTP Server error event:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`[CRITICAL] Port ${port} is already in use!`);
      process.exit(1);
    }
  });

  httpServer.listen(port, host, () => {
    console.log(`\n========== SERVER LISTENING ==========`);
    console.log(`✅ listening on ${host}:${port}`);
    console.log(`✅ Process ${process.pid} is ready for requests`);
    console.log(`========== SERVER READY ===========\n`);
  });

  // Capture server reference for debug endpoint
  serverInstance = httpServer;

  // Keep process alive
  httpServer.on('close', () => {
    console.log('⚠️  Server closed event fired');
  });

  process.on('beforeExit', (code) => {
    console.log('⚠️  Process beforeExit with code:', code);
  });

  process.on('exit', (code) => {
    console.log('⚠️  Process exit with code:', code);
  });
})().catch((err) => {
  console.error('[CRITICAL] Failed to start server:', err);
  process.exit(1);
});

