import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

const dbUrl = process.env.DATABASE_URL;
const isSqlite = dbUrl.startsWith("file:");

let config: any = {
  out: "./migrations",
  schema: "./shared/schema.ts",
};

if (isSqlite) {
  // SQLite configuration
  const dbPath = dbUrl.split("?")[0].replace("file:", "").trim();
  const dbPathResolved = path.resolve(dbPath);
  
  config = {
    ...config,
    dialect: "sqlite",
    dbCredentials: {
      url: dbUrl,
    },
  };
  
  console.log("🗄️  Using SQLite:", dbPathResolved);
} else {
  // PostgreSQL configuration
  config = {
    ...config,
    dialect: "postgresql",
    dbCredentials: {
      url: dbUrl,
      ssl: { 
        rejectUnauthorized: false 
      },
    },
  };
  
  console.log("🐘 Using PostgreSQL");
}

export default defineConfig(config);
