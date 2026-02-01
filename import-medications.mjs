import pkg from 'pg';
const { Client } = pkg;

// Função para normalizar nomes
function normalizeString(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Medicações pediátricas do FloatingCalculator.tsx
const PEDIATRIC_MEDS = [
  { medication: "Dipirona", dosePerKg: "15", maxDose: "1000", unit: "mg", interval: "6/6h", pharmaceuticalForm: "Gotas", concentration: "500mg/ml", ageGroup: "pediatrico", category: "Analgésicos" },
  { medication: "Paracetamol", dosePerKg: "15", maxDose: "750", unit: "mg", interval: "6/6h", pharmaceuticalForm: "Gotas", concentration: "200mg/ml", ageGroup: "pediatrico", category: "Analgésicos" },
  { medication: "Ibuprofeno", dosePerKg: "10", maxDose: "400", unit: "mg", interval: "8/8h", pharmaceuticalForm: "Gotas", concentration: "50mg/ml", ageGroup: "pediatrico", category: "Anti-inflamatórios" },
  { medication: "Amoxicilina", dosePerKg: "50", maxDose: "1500", unit: "mg/dia", interval: "8/8h", pharmaceuticalForm: "Suspensão", concentration: "250mg/5ml", ageGroup: "pediatrico", category: "Antibióticos" },
  { medication: "Azitromicina", dosePerKg: "10", maxDose: "500", unit: "mg/dia", interval: "1x/dia", pharmaceuticalForm: "Suspensão", concentration: "200mg/5ml", ageGroup: "pediatrico", category: "Antibióticos" },
  { medication: "Cefalexina", dosePerKg: "50", maxDose: "2000", unit: "mg/dia", interval: "6/6h", pharmaceuticalForm: "Suspensão", concentration: "250mg/5ml", ageGroup: "pediatrico", category: "Antibióticos" },
  { medication: "Prednisolona", dosePerKg: "1", maxDose: "60", unit: "mg/dia", interval: "1x/dia", pharmaceuticalForm: "Solução", concentration: "3mg/ml", ageGroup: "pediatrico", category: "Corticosteroides" },
  { medication: "Metoclopramida", dosePerKg: "0.15", maxDose: "10", unit: "mg", interval: "8/8h", pharmaceuticalForm: "Gotas", concentration: "4mg/ml", ageGroup: "pediatrico", category: "Antieméticos" },
  { medication: "Ondansetrona", dosePerKg: "0.15", maxDose: "8", unit: "mg", interval: "8/8h", pharmaceuticalForm: "Ampola", concentration: "2mg/ml", ageGroup: "pediatrico", category: "Antieméticos" },
];

// Medicações de emergência
const EMERGENCY_MEDS = [
  { medication: "Adrenalina (PCR)", dose: "0.01", concentration: "1mg/ml", route: "IV", ageGroup: "adulto", category: "Emergência" },
  { medication: "Midazolam", dose: "0.1", concentration: "5mg/ml", route: "IV/IM", ageGroup: "adulto", category: "Sedativos" },
  { medication: "Fentanil", dose: "0.001", concentration: "0.05mcg/ml", route: "IV", ageGroup: "adulto", category: "Analgésicos" },
  { medication: "Ketamina", dose: "1.5", concentration: "50mg/ml", route: "IV/IM", ageGroup: "adulto", category: "Anestésicos" },
  { medication: "Rocurônio", dose: "1", concentration: "10mg/ml", route: "IV", ageGroup: "adulto", category: "Bloqueadores Neuromusculares" },
  { medication: "Atropina", dose: "0.02", concentration: "0.5mg/ml", route: "IV/IM", ageGroup: "adulto", category: "Antiarrítmicos" },
  { medication: "Diazepam", dose: "0.3", concentration: "5mg/ml", route: "IV/IM", ageGroup: "adulto", category: "Benzodiazepínicos" },
  { medication: "Dexametasona", dose: "0.6", concentration: "4mg/ml", route: "IV/IM", ageGroup: "adulto", category: "Corticosteroides" },
];

// Medicações comuns adultos
const ADULT_COMMON_MEDS = [
  { medication: "Ácido Acetilsalicílico (AAS)", dose: "100-500", route: "VO", ageGroup: "adulto", category: "Antiplaquetários" },
  { medication: "Atorvastatina", dose: "10-80", unit: "mg/dia", route: "VO", ageGroup: "adulto", category: "Estatinas" },
  { medication: "Losartana", dose: "50-100", unit: "mg/dia", route: "VO", ageGroup: "adulto", category: "Anti-hipertensivos" },
  { medication: "Metformina", dose: "500-1000", unit: "mg/dia", route: "VO", ageGroup: "adulto", category: "Antidiabéticos" },
  { medication: "Lisinopril", dose: "10-40", unit: "mg/dia", route: "VO", ageGroup: "adulto", category: "IECA" },
  { medication: "Omeprazol", dose: "20-40", unit: "mg/dia", route: "VO", ageGroup: "adulto", category: "Inibidores de Bomba de Prótons" },
  { medication: "Levotiroxina", dose: "25-200", unit: "mcg/dia", route: "VO", ageGroup: "adulto", category: "Hormônios" },
  { medication: "Varfarina", dose: "2-10", unit: "mg/dia", route: "VO", ageGroup: "adulto", category: "Anticoagulantes" },
  { medication: "Fluoxetina", dose: "20-40", unit: "mg/dia", route: "VO", ageGroup: "adulto", category: "Antidepressivos" },
  { medication: "Metoprolol", dose: "50-200", unit: "mg/dia", route: "VO", ageGroup: "adulto", category: "Beta-bloqueadores" },
];

async function importMedications() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error("❌ DATABASE_URL não configurada");
    process.exit(1);
  }

  const client = new Client({ 
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log("✓ Conectado ao banco de dados\n");
    
    const allMeds = [...PEDIATRIC_MEDS, ...EMERGENCY_MEDS, ...ADULT_COMMON_MEDS];
    
    let inserted = 0;
    let duplicates = 0;

    console.log("Importando medicações...\n");

    for (const med of allMeds) {
      const nameNormalized = normalizeString(med.medication);
      
      try {
        // Verificar se já existe
        const exists = await client.query(
          'SELECT id FROM medications WHERE name_normalized = $1',
          [nameNormalized]
        );
        
        if (exists.rows.length > 0) {
          duplicates++;
          continue;
        }

        // Preparar dados
        const presentation = med.pharmaceuticalForm || med.route || 'N/A';
        const concentration = med.concentration || null;
        const dose = med.dose || (med.dosePerKg ? `${med.dosePerKg} mg/kg` : null);
        const interval = med.interval || null;
        const route = med.route || null;
        const ageGroup = med.ageGroup || 'ambos';
        const category = med.category || 'Outros';

        // Inserir nova medicação
        await client.query(
          `INSERT INTO medications 
           (name, name_normalized, presentation, dose, dose_per_kg, max_dose, interval, route, 
            concentration_text, age_group, category, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, NOW(), NOW())`,
          [
            med.medication,
            nameNormalized,
            presentation,
            dose,
            med.dosePerKg || null,
            med.maxDose || null,
            interval,
            route,
            concentration,
            ageGroup,
            category
          ]
        );
        
        inserted++;
        
        if (inserted % 20 === 0) {
          console.log(`  Processadas ${inserted} medicações...`);
        }
      } catch (err) {
        console.error(`  Erro ao inserir "${med.medication}":`, err.message);
      }
    }

    console.log(`\n✓ IMPORTAÇÃO CONCLUÍDA!`);
    console.log(`  Medicações inseridas: ${inserted}`);
    console.log(`  Duplicatas ignoradas: ${duplicates}`);

    // Verificar contagem
    const result = await client.query('SELECT COUNT(*) as count FROM medications');
    console.log(`  Total de medicações no banco: ${result.rows[0].count}`);

  } catch (error) {
    console.error("❌ Erro geral:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

importMedications();
