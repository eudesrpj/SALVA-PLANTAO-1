const { Client } = require("pg");

async function recoverData() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error("❌ DATABASE_URL não configurada");
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl });
  
  try {
    await client.connect();
    console.log("✓ Conectado ao banco de dados\n");
    
    // Recuperar medicações
    console.log("=== MEDICAÇÕES SALVAS ===");
    const medRes = await client.query(`
      SELECT id, name, presentation, dose, route, concentration_text, category
      FROM medications
      ORDER BY created_at DESC
      LIMIT 50
    `);
    
    console.log(`Total de medicações: ${medRes.rows.length}`);
    if (medRes.rows.length > 0) {
      console.log("\nMedicações recuperadas:");
      medRes.rows.forEach((med, idx) => {
        console.log(`\n${idx + 1}. ${med.name}`);
        if (med.presentation) console.log(`   Apresentação: ${med.presentation}`);
        if (med.dose) console.log(`   Dose: ${med.dose}`);
        if (med.route) console.log(`   Via: ${med.route}`);
        if (med.concentration_text) console.log(`   Concentração: ${med.concentration_text}`);
        if (med.category) console.log(`   Categoria: ${med.category}`);
      });
    }

    // Recuperar patologias
    console.log("\n\n=== PATOLOGIAS/DOENÇAS SALVAS ===");
    const pathRes = await client.query(`
      SELECT id, name, description, age_group, specialty, category
      FROM pathologies
      ORDER BY created_at DESC
      LIMIT 50
    `);
    
    console.log(`Total de patologias: ${pathRes.rows.length}`);
    if (pathRes.rows.length > 0) {
      console.log("\nPatologias recuperadas:");
      pathRes.rows.forEach((p, idx) => {
        console.log(`\n${idx + 1}. ${p.name}`);
        if (p.description) console.log(`   Descrição: ${p.description}`);
        if (p.age_group) console.log(`   Grupo etário: ${p.age_group}`);
        if (p.specialty) console.log(`   Especialidade: ${p.specialty}`);
        if (p.category) console.log(`   Categoria: ${p.category}`);
      });
    }

    // Resumo
    console.log("\n\n=== RESUMO ===");
    console.log(`Total de medicações: ${medRes.rows.length}`);
    console.log(`Total de patologias: ${pathRes.rows.length}`);
    console.log("\n✓ Dados recuperados com sucesso!");

  } catch (error) {
    console.error("❌ Erro ao recuperar dados:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

recoverData();
