// Reset admin password
require("dotenv/config");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL não configurado");
  process.exit(1);
}

const NEW_PASSWORD = "admin123";
const ADMIN_EMAIL = "eudesrpj@gmail.com";

async function resetPassword() {
  const pool = new Pool({ 
    connectionString,
    ssl: connectionString.includes("sslmode=no-verify") 
      ? { rejectUnauthorized: false } 
      : undefined
  });
  
  try {
    console.log(`🔐 Resetando senha para: ${ADMIN_EMAIL}\n`);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
    console.log(`✅ Senha hasheada: ${hashedPassword.substring(0, 30)}...\n`);
    
    // Update in database
    const result = await pool.query(
      `UPDATE users 
       SET password_hash = $1, 
           updated_at = NOW()
       WHERE email = $2
       RETURNING id, email, role`,
      [hashedPassword, ADMIN_EMAIL]
    );
    
    if (result.rowCount === 0) {
      console.error(`❌ Usuário ${ADMIN_EMAIL} não encontrado!`);
      process.exit(1);
    }
    
    console.log(`✅ Senha atualizada com sucesso!`);
    console.log(`\n📝 Credenciais de login:`);
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Senha: ${NEW_PASSWORD}`);
    console.log(`   Role: ${result.rows[0].role}`);
    
    await pool.end();
  } catch (error) {
    console.error("❌ Erro ao resetar senha:", error.message);
    process.exit(1);
  }
}

resetPassword();
