import pkg from 'pg';
const { Client } = pkg;

async function checkAllTables() {
  const client = new Client({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    
    // Listar todas as tabelas
    const tables = await client.query(
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    );
    
    console.log("=== TABELAS EXISTENTES ===");
    for (const table of tables.rows) {
      const count = await client.query(\SELECT COUNT(*) as count FROM \\);
      console.log(\\: \ registros\);
    }
    
  } finally {
    await client.end();
  }
}

checkAllTables();
