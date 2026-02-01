import "dotenv/config";

/*
© Salva Plantão
Uso não autorizado é proibido.
Contato oficial: suporte@appsalvaplantao.com
*/

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { setupWebSocket } from "./websocket";

const app = express();
const httpServer = createServer(app);

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

// CORS middleware - permitir cookies com rewrite do Firebase
app.use((req, res, next) => {
  const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || '*';
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "3600");
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Health check endpoint - FIRST MIDDLEWARE, before anything else
app.get("/health", (_req, res) => {
  console.log("[DEBUG] /health endpoint called");
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    auth: "independent",
    node: process.version,
  });
});

// DEBUG: Listen state endpoint (PASSO 3)
let serverInstance: any = null;
app.get("/_debug/listen", (_req, res) => {
  try {
    const addr = serverInstance?.address?.() || "unknown";
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
  // Register routes NOW (before listen)
  try {
    await registerRoutes(httpServer, app);
    console.log("[DEBUG] Routes registered successfully");
  } catch (error) {
    console.error("[ERROR] Failed to register routes:", error);
    process.exit(1);
  }

  // Setup error handler NOW
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("[DEBUG] Error handler invoked:", err);
    
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // Setup static file serving NOW
  try {
    serveStatic(app);
    console.log("[DEBUG] Static file configuration complete");
  } catch (error) {
    console.error("[WARNING] Failed to configure static files:", error);
  }

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

