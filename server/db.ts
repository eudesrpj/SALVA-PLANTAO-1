import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import pg from "pg";
import * as schema from "@shared/schema";
import path from "path";

const { Pool } = pg;

let db: any;
let pool: any;

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL não configurado");
  throw new Error(
    "DATABASE_URL obrigatória. Configure Neon.tech ou PostgreSQL!",
  );
}

const dbUrl = process.env.DATABASE_URL || "";

// Detectar tipo de database
const isSqlite = dbUrl.startsWith("file:");

if (isSqlite) {
  console.log("🗄️  Usando SQLite para desenvolvimento...");
  try {
    // Parse SQLite path: file:./dev.db?mode=rwc
    const dbPath = dbUrl.split("?")[0].replace("file:", "").trim();
    const dbPathResolved = path.resolve(dbPath);
    
    console.log(`📁 Database: ${dbPathResolved}`);
    
    const sqlite = new Database(dbPathResolved);
    
    // Enable foreign keys
    sqlite.pragma("journal_mode = WAL");
    
    db = drizzleSqlite(sqlite, { schema });
    
    console.log("✅ SQLite conectado com sucesso (desenvolvimento)");
  } catch (error) {
    console.error("❌ Erro ao conectar SQLite:", error);
    throw error;
  }
} else {
  // PostgreSQL
  console.log("🐘 Usando PostgreSQL...");
  try {
    pool = new Pool({
      connectionString: dbUrl,
      ssl: process.env.NODE_ENV === "production"
        ? {
            rejectUnauthorized: false,
            ca: undefined,
          }
        : false,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
      max: 20,
      allowExitOnIdle: false,
    });

    pool.on("connect", () => {
      console.log("✅ Conectado ao PostgreSQL");
    });

    pool.on("error", (err: any) => {
      if (err.code === "ECONNREFUSED") {
        console.error("❌ Database não está rodando!");
      }
    });

    // Test connection
    pool.query("SELECT NOW()", (err: any, result: any) => {
      if (err) {
        console.error("❌ Falha ao conectar ao PostgreSQL:", err.message);
      } else {
        console.log("✅ PostgreSQL conectado com sucesso");
      }
    });

    db = drizzlePg(pool, { schema });
  } catch (error) {
    console.error("❌ Erro ao inicializar PostgreSQL:", error);
    throw error;
  }
}

export { pool, db };
