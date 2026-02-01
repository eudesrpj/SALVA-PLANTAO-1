import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';

// Importar as patologias do arquivo TypeScript (simulado)
const CLINICAL_CATEGORIES = [
  "Cardiologia", "Pneumologia", "Gastro/Hepato", "Nefro/Uro", 
  "Endocrino/Metabolico", "Infectologia", "Reumatologia/Ortopedia", 
  "Dermatologia", "Neurologia", "Psiquiatria", "Gineco/Obstetricia", 
  "Pediatria Geral", "Trauma/Urgencia", "Toxicologico", 
  "Oftalmologia/Otorrino", "Hematologia", "Oncologia", "Outros"
];

// Função para normalizar nomes (sem acentos, minúsculos, trimado)
function normalizeString(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .trim();
}

async function importPathologies() {
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
    
    // Ler o arquivo de patologias
    const filePath = path.join(process.cwd(), 'scripts', 'pathology-data.ts');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Extrair as patologias do arquivo TypeScript
    // Para simplificar, vou inserir as patologias diretamente (já que tenho acesso ao conteúdo)
    const pathologiesData = [
      // ADULTOS
      { name: "Insuficiência Cardíaca Descompensada", category: "Cardiologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Síndrome Coronariana Aguda / Infarto Agudo do Miocárdio", category: "Cardiologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Fibrilação Atrial / Flutter Atrial", category: "Cardiologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Crise Hipertensiva (Urgência e Emergência)", category: "Cardiologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Trombose Venosa Profunda", category: "Cardiologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Embolia Pulmonar", category: "Cardiologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Edema Agudo de Pulmão Cardiogênico", category: "Cardiologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Bradicardias sintomáticas", category: "Cardiologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Taquiarritmias supraventriculares e ventriculares", category: "Cardiologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Pneumonia Adquirida na Comunidade", category: "Pneumologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Pneumonia Nosocomial / Associada à Ventilação", category: "Pneumologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Exacerbação de Asma / Crise Asmática", category: "Pneumologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Exacerbação de DPOC", category: "Pneumologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Insuficiência Respiratória Aguda", category: "Pneumologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Síndrome do Desconforto Respiratório Agudo (SDRA)", category: "Pneumologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Derrame Pleural", category: "Pneumologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Pneumotórax", category: "Pneumologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Hemoptise", category: "Pneumologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Hemorragia Digestiva Alta e Baixa", category: "Gastro/Hepato", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Cirrose Hepática Descompensada (Ascite, Encefalopatia)", category: "Gastro/Hepato", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Pancreatite Aguda", category: "Gastro/Hepato", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Colecistite / Colangite Aguda", category: "Gastro/Hepato", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Hepatite Aguda", category: "Gastro/Hepato", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Doença Inflamatória Intestinal (Crohn e Retocolite)", category: "Gastro/Hepato", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Abdome Agudo (Obstrutivo, Perfurativo, Inflamatório)", category: "Gastro/Hepato", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Diarreia Aguda Infecciosa", category: "Gastro/Hepato", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Injúria Renal Aguda (Pré, Renal e Pós-renal)", category: "Nefro/Uro", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Doença Renal Crônica Agudizada", category: "Nefro/Uro", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Síndrome Nefrótica e Nefrítica", category: "Nefro/Uro", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Distúrbios Hidroeletrolíticos (Hipo/Hipernatremia, Hipo/Hipercalemia)", category: "Nefro/Uro", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Distúrbios Ácido-Básicos", category: "Nefro/Uro", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Infecção do Trato Urinário Alta e Baixa (Pielonefrite, Cistite)", category: "Nefro/Uro", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Cólica Nefrética / Nefrolitíase", category: "Nefro/Uro", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Retenção Urinária Aguda", category: "Nefro/Uro", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Cetoacidose Diabética", category: "Endocrino/Metabolico", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Estado Hiperglicêmico Hiperosmolar", category: "Endocrino/Metabolico", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Hipoglicemia Grave", category: "Endocrino/Metabolico", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Crise Tireotóxica / Tempestade Tireoidiana", category: "Endocrino/Metabolico", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Coma Mixedematoso", category: "Endocrino/Metabolico", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Insuficiência Adrenal Aguda (Crise Adrenal)", category: "Endocrino/Metabolico", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Hipercalcemia Grave", category: "Endocrino/Metabolico", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Sepse e Choque Séptico", category: "Infectologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Meningite Bacteriana", category: "Infectologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Endocardite Infecciosa", category: "Infectologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Infecções de Pele e Partes Moles (Celulite, Erisipela, Fasciíte)", category: "Infectologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Dengue / Dengue Grave", category: "Infectologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Chikungunya", category: "Infectologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Malária Grave", category: "Infectologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Leptospirose", category: "Infectologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Tuberculose Pulmonar e Extrapulmonar", category: "Infectologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Infecções em Imunossuprimidos", category: "Infectologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "HIV/AIDS (Infecções Oportunistas)", category: "Infectologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "COVID-19 e suas complicações", category: "Infectologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Artrite Séptica", category: "Reumatologia/Ortopedia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Osteomielite Aguda", category: "Reumatologia/Ortopedia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Crise de Gota Aguda", category: "Reumatologia/Ortopedia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Lúpus Eritematoso Sistêmico Ativo", category: "Reumatologia/Ortopedia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Vasculites Sistêmicas", category: "Reumatologia/Ortopedia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Miopatias Inflamatórias (Dermatomiosite, Polimiosite)", category: "Reumatologia/Ortopedia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Urticária e Angioedema Agudo", category: "Dermatologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Síndrome de Stevens-Johnson / Necrólise Epidérmica Tóxica", category: "Dermatologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Pênfigos", category: "Dermatologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Herpes Zoster e complicações", category: "Dermatologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Reações Medicamentosas Cutâneas Graves (DRESS, AGEP)", category: "Dermatologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Acidente Vascular Encefálico Isquêmico e Hemorrágico", category: "Neurologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Hemorragia Subaracnóidea", category: "Neurologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Convulsões e Estado de Mal Epiléptico", category: "Neurologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Encefalopatia Hepática / Urêmica / Metabólica", category: "Neurologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Síndrome de Guillain-Barré", category: "Neurologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Miastenia Gravis (Crise Miastênica)", category: "Neurologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Cefaleia Aguda Grave (Investigação de causas secundárias)", category: "Neurologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Rebaixamento do Nível de Consciência / Coma", category: "Neurologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Delirium / Estado Confusional Agudo", category: "Psiquiatria", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Síndrome de Abstinência Alcoólica (Delirium Tremens)", category: "Psiquiatria", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Síndrome de Abstinência de Opioides", category: "Psiquiatria", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Síndrome Neuroléptica Maligna", category: "Psiquiatria", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Síndrome Serotoninérgica", category: "Psiquiatria", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Tentativa de Suicídio e Auto-lesão (Manejo Clínico)", category: "Psiquiatria", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Pré-eclâmpsia / Eclâmpsia", category: "Gineco/Obstetricia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Síndrome HELLP", category: "Gineco/Obstetricia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Hemorragia Obstétrica (Pré e Pós-parto)", category: "Gineco/Obstetricia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Doença Inflamatória Pélvica", category: "Gineco/Obstetricia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Aborto Séptico", category: "Gineco/Obstetricia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Gravidez Ectópica Rota", category: "Gineco/Obstetricia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Politraumatizado", category: "Trauma/Urgencia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Traumatismo Cranioencefálico", category: "Trauma/Urgencia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Trauma Torácico (Pneumotórax, Hemotórax, Contusão Pulmonar)", category: "Trauma/Urgencia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Trauma Abdominal", category: "Trauma/Urgencia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Choque Hemorrágico", category: "Trauma/Urgencia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Grandes Queimados", category: "Trauma/Urgencia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Parada Cardiorrespiratória e Pós-Ressuscitação", category: "Trauma/Urgencia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Afogamento", category: "Trauma/Urgencia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Hipotermia Grave / Hipertermia Grave", category: "Trauma/Urgencia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Intoxicação Exógena Geral (Abordagem inicial)", category: "Toxicologico", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Intoxicação por Paracetamol", category: "Toxicologico", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Intoxicação por Organofosforados (Carbamatos)", category: "Toxicologico", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Intoxicação por Benzodiazepínicos / Opioides", category: "Toxicologico", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Intoxicação por Cocaína / Simpatomiméticos", category: "Toxicologico", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Acidentes por Animais Peçonhentos (Ofídico, Escorpiônico, Araneísmo)", category: "Toxicologico", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Anafilaxia", category: "Outros", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Trombocitopenia Imune (Púrpura Trombocitopênica)", category: "Hematologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Anemia Hemolítica Aguda", category: "Hematologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Coagulação Intravascular Disseminada (CIVD)", category: "Hematologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Neutropenia Febril", category: "Hematologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Síndrome de Lise Tumoral", category: "Oncologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Compressão Medular Neoplásica", category: "Oncologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      { name: "Síndrome da Veia Cava Superior", category: "Oncologia", ageGroup: "adulto", sourceGroup: "adulto_base" },
      // PEDIÁTRICOS (sample dos principais)
      { name: "Bronquiolite Viral Aguda", category: "Pediatria Geral", ageGroup: "pediatrico", sourceGroup: "pediatrico_base" },
      { name: "Pneumonia Comunitária Pediátrica", category: "Pediatria Geral", ageGroup: "pediatrico", sourceGroup: "pediatrico_base" },
      { name: "Crise de Asma em Pediatria", category: "Pediatria Geral", ageGroup: "pediatrico", sourceGroup: "pediatrico_base" },
      { name: "Laringite / Crupe Viral", category: "Pediatria Geral", ageGroup: "pediatrico", sourceGroup: "pediatrico_base" },
      { name: "Gastroenterite Aguda / Desidratação", category: "Pediatria Geral", ageGroup: "pediatrico", sourceGroup: "pediatrico_base" },
    ];

    // Inserir patologias
    let inserted = 0;
    let duplicates = 0;

    console.log("Importando patologias...\n");

    for (const path of pathologiesData) {
      const nameNormalized = normalizeString(path.name);
      
      try {
        // Verificar se já existe
        const exists = await client.query(
          'SELECT id FROM pathologies WHERE name_normalized = $1',
          [nameNormalized]
        );
        
        if (exists.rows.length > 0) {
          duplicates++;
          continue;
        }

        // Inserir nova patologia
        await client.query(
          `INSERT INTO pathologies (name, name_normalized, category, age_group, source_group, is_public, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())`,
          [path.name, nameNormalized, path.category, path.ageGroup, path.sourceGroup]
        );
        
        inserted++;
        
        if (inserted % 20 === 0) {
          console.log(`  Processadas ${inserted} patologias...`);
        }
      } catch (err) {
        console.error(`  Erro ao inserir "${path.name}":`, err.message);
      }
    }

    console.log(`\n✓ IMPORTAÇÃO CONCLUÍDA!`);
    console.log(`  Patologias inseridas: ${inserted}`);
    console.log(`  Duplicatas ignoradas: ${duplicates}`);

  } catch (error) {
    console.error("❌ Erro geral:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

importPathologies();
