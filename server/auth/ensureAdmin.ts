import bcrypt from "bcryptjs";
import { authStorage } from "../replit_integrations/auth/storage";

const ADMIN_EMAIL = "eudesrpj@gmail.com";
const ADMIN_PASSWORD = "Spdf0123";

/**
 * Garante que o admin existe no banco com a senha correta
 * Não apaga usuários existentes, apenas cria ou atualiza se necessário
 */
export async function ensureAdminExists(): Promise<void> {
  try {
    const existingUser = await authStorage.getUserByEmail(ADMIN_EMAIL);
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    
    if (!existingUser) {
      // Criar novo admin
      await authStorage.upsertUser({
        email: ADMIN_EMAIL,
        firstName: "Admin",
        lastName: "Salva Plantão",
        role: "admin",
        status: "active",
        passwordHash,
        authProvider: "email",
        subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
      });
      console.log("✓ Admin criado:", ADMIN_EMAIL);
    } else {
      // Atualizar apenas se necessário
      if (existingUser.role !== "admin" || existingUser.status !== "active" || !existingUser.passwordHash) {
        await authStorage.upsertUser({
          ...existingUser,
          role: "admin",
          status: "active",
          passwordHash,
        });
        console.log("✓ Admin atualizado:", ADMIN_EMAIL);
      } else {
        console.log("✓ Admin já existe:", ADMIN_EMAIL);
      }
    }
  } catch (error) {
    console.error("✗ Erro ao garantir admin:", error);
  }
}
