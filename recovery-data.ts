import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { medications, pathologies } from "./shared/schema.js";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function recoverData() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL não configurada");
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl });
  
  try {
    await client.connect();
    console.log("✓ Conectado ao banco de dados");
    
    const db = drizzle(client);

    // Recuperar medicações
    console.log("\n=== MEDICAÇÕES SALVAS ===");
    const allMedications = await db.select().from(medications);
    console.log(`Total de medicações: ${allMedications.length}`);
    
    if (allMedications.length > 0) {
      console.log("\nPrimeiras 10 medicações:");
      allMedications.slice(0, 10).forEach((med, idx) => {
        console.log(`\n${idx + 1}. ${med.name}`);
        console.log(`   Apresentação: ${med.presentation || "N/A"}`);
        console.log(`   Dose: ${med.dose || "N/A"}`);
        console.log(`   Via: ${med.route || "N/A"}`);
      });
    }

    // Recuperar patologias
    console.log("\n\n=== PATOLOGIAS/DOENÇAS SALVAS ===");
    const allPathologies = await db.select().from(pathologies);
    console.log(`Total de patologias: ${allPathologies.length}`);
    
    if (allPathologies.length > 0) {
      console.log("\nPrimeiras 10 patologias:");
      allPathologies.slice(0, 10).forEach((path, idx) => {
        console.log(`\n${idx + 1}. ${path.name}`);
        console.log(`   Descrição: ${path.description || "N/A"}`);
        console.log(`   Grupo etário: ${path.ageGroup || "N/A"}`);
        console.log(`   Specialty: ${path.specialty || "N/A"}`);
      });
    }

    // Salvar em arquivo JSON para backup
    const backupData = {
      timestamp: new Date().toISOString(),
      medications: allMedications,
      pathologies: allPathologies,
      summary: {
        totalMedications: allMedications.length,
        totalPathologies: allPathologies.length,
      }
    };

    const backupPath = path.join(__dirname, "recovery-backup.json");
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    console.log(`\n✓ Backup salvo em: ${backupPath}`);

  } catch (error) {
    console.error("❌ Erro ao recuperar dados:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

recoverData().then(() => {
  console.log("\n✓ Recuperação concluída!");
  process.exit(0);
}).catch(error => {
  console.error("Erro fatal:", error);
  process.exit(1);
});
