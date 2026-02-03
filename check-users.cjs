// Check users in database
require("dotenv/config");
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL não configurado");
  process.exit(1);
}

async function checkUsers() {
  const pool = new Pool({ 
    connectionString,
    ssl: connectionString.includes("sslmode=no-verify") 
      ? { rejectUnauthorized: false } 
      : undefined
  });
  
  try {
    console.log("🔍 Verificando usuários no banco...\n");
    
    const result = await pool.query(`
      SELECT id, email, role, status, 
             CASE WHEN password_hash IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_senha,
             first_name, last_name
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`📊 Total de usuários: ${result.rowCount}\n`);
    
    if (result.rowCount === 0) {
      console.log("❌ Nenhum usuário encontrado no banco!");
      console.log("\n💡 Você precisa criar um usuário primeiro.");
      console.log("   Execute: npm run dev e faça signup na interface");
    } else {
      console.log("👥 Usuários encontrados:\n");
      result.rows.forEach((user, i) => {
        console.log(`${i + 1}. ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Nome: ${user.first_name} ${user.last_name}`);
        console.log(`   Tem senha: ${user.tem_senha}`);
        console.log("");
      });
      
      // Se tem admin, mostrar info
      const admins = result.rows.filter(u => u.role === 'admin');
      if (admins.length > 0) {
        console.log(`✅ ${admins.length} admin(s) encontrado(s)`);
        console.log(`   Use: ${admins[0].email} para fazer login`);
      }
    }
    
    await pool.end();
  } catch (error) {
    console.error("❌ Erro ao verificar usuários:", error.message);
    process.exit(1);
  }
}

checkUsers();
