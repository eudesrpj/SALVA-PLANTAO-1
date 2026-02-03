import type { Express } from "express";
import { requestEmailAuth, verifyEmailCode, verifyMagicLink, deleteUserAccount } from "./authService";
import { setAuthCookies, clearAuthCookies, createToken, authenticate } from "./independentAuth";
import { storage } from "../storage";
import bcrypt from "bcryptjs";

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/email/request", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "Email é obrigatório" });
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Email inválido" });
      }
      
      const appUrl = process.env.APP_URL;
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers.host || req.hostname;
      const baseUrl = appUrl ? appUrl.replace(/\/$/, "") : `${protocol}://${host}`;
      
      const result = await requestEmailAuth(email, baseUrl);
      
      if (!result.success) {
        return res.status(500).json({ message: result.error });
      }
      
      res.json({ success: true, message: "Código enviado para o email" });
    } catch (error) {
      console.error("Email auth request error:", error);
      res.status(500).json({ message: "Erro interno" });
    }
  });

  app.post("/api/auth/email/verify-code", async (req, res) => {
    try {
      const { email, code } = req.body;
      
      if (!email || !code) {
        return res.status(400).json({ message: "Email e código são obrigatórios" });
      }
      
      const result = await verifyEmailCode(email, code);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }
      
      const user = await storage.getUser(result.userId!);
      
      if (!user) {
        return res.status(500).json({ message: "Erro ao buscar usuário" });
      }
      
      if (req.session) {
        (req.session as any).userId = user.id;
        (req.session as any).user = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          profileImageUrl: user.profileImageUrl
        };
      }

      setAuthCookies(res, user.id);

      const token = createToken(user.id, false);
      
      res.json({ 
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          profileImageUrl: user.profileImageUrl
        }
      });
    } catch (error) {
      console.error("Code verification error:", error);
      res.status(500).json({ message: "Erro interno" });
    }
  });

  app.get("/api/auth/email/verify-magic", async (req, res) => {
    try {
      const token = req.query.token as string;
      
      if (!token) {
        return res.redirect("/login?error=invalid_token");
      }
      
      const result = await verifyMagicLink(token);
      
      if (!result.success) {
        return res.redirect("/login?error=expired_token");
      }
      
      const user = await storage.getUser(result.userId!);
      
      if (!user) {
        return res.redirect("/login?error=user_not_found");
      }
      
      if (req.session) {
        (req.session as any).userId = user.id;
        (req.session as any).user = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          profileImageUrl: user.profileImageUrl
        };
      }

      setAuthCookies(res, user.id);
      const authToken = createToken(user.id, false);

      const wantsJson = String(req.headers.accept || "").includes("application/json") || req.query.json === "1";
      if (wantsJson) {
        return res.json({
          success: true,
          token: authToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status,
            profileImageUrl: user.profileImageUrl
          }
        });
      }
      
      res.redirect("/");
    } catch (error) {
      console.error("Magic link verification error:", error);
      res.redirect("/login?error=internal_error");
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    clearAuthCookies(res);

    if (!req.session) {
      res.clearCookie("connect.sid");
      return res.json({ success: true });
    }

    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  // Login por senha (dev/fallback)
  app.post("/api/auth/login-password", async (req, res) => {
    try {
      console.log("[LOGIN-PASSWORD] Tentativa de login:", req.body.email);
      const { email, password } = req.body;
      
      if (!email || !password) {
        console.log("[LOGIN-PASSWORD] Email ou senha faltando");
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }
      
      const user = await storage.getUserByEmail(email);
      console.log("[LOGIN-PASSWORD] Usuário encontrado:", user ? user.id : "não encontrado");
      
      if (!user || !user.passwordHash) {
        console.log("[LOGIN-PASSWORD] Usuário sem senha ou não existe");
        return res.status(401).json({ message: "Credenciais inválidas" });
      }
      
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      console.log("[LOGIN-PASSWORD] Senha válida:", isValidPassword);
      
      if (!isValidPassword) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }
      
      // Set auth cookies (mesma forma que o sistema JWT)
      setAuthCookies(res, user.id);
      console.log("[LOGIN-PASSWORD] Cookies setados para userId:", user.id);
      
      // Também retornar token para o frontend usar em headers
      const token = createToken(user.id, false);
      
      res.json({ 
        ok: true,
        token, // Token JWT para usar em headers
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl
        }
      });
      console.log("[LOGIN-PASSWORD] Login bem-sucedido para:", user.email);
    } catch (error) {
      console.error("[LOGIN-PASSWORD] Erro no login:", error);
      res.status(500).json({ message: "Erro interno" });
    }
  });

  app.delete("/api/account", async (req, res) => {
    const userId = (req.session as any)?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    const result = await deleteUserAccount(userId);
    
    if (!result.success) {
      return res.status(500).json({ message: result.error });
    }
    
    if (!req.session) {
      res.clearCookie("connect.sid");
      return res.json({ success: true });
    }

    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  // GET /api/auth/identities - List all linked accounts for current user
  app.get("/api/auth/identities", authenticate, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const identities = await storage.getAuthIdentitiesByUserId(userId);
      const formatted = identities.map(i => ({
        id: i.id,
        provider: i.provider,
        email: i.email || i.providerUserId,
        createdAt: i.createdAt
      }));

      res.json(formatted);
    } catch (error) {
      console.error("Get identities error:", error);
      res.status(500).json({ message: "Erro ao listar contas" });
    }
  });

  // DELETE /api/auth/identities/:id - Unlink an account
  app.delete("/api/auth/identities/:id", authenticate, async (req, res) => {
    try {
      const userId = req.userId;
      const identityId = parseInt(req.params.id);

      if (!userId || isNaN(identityId)) {
        return res.status(400).json({ message: "Parâmetros inválidos" });
      }

      // Get identity and verify ownership
      const allIdentities = await storage.getAuthIdentitiesByUserId(userId);
      const identity = allIdentities.find(i => i.id === identityId);

      if (!identity) {
        return res.status(404).json({ message: "Conta não encontrada" });
      }

      // Check if user has at least one other identity
      if (allIdentities.length <= 1) {
        return res.status(400).json({ message: "Você deve manter pelo menos um método de autenticação" });
      }

      // Delete identity
      await storage.deleteAuthIdentity(identityId);

      res.json({ success: true, message: "Conta desvinculada" });
    } catch (error) {
      console.error("Delete identity error:", error);
      res.status(500).json({ message: "Erro ao desvincular conta" });
    }
  });
}
