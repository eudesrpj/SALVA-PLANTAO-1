/*
© Salva Plantão
Uso não autorizado é proibido.
Contato oficial: suporte@appsalvaplantao.com

INDEPENDENT AUTHENTICATION SYSTEM
- Email + Password authentication
- HttpOnly secure cookies
- NO Replit dependency
- Production-grade implementation
*/

import type { Express, Request, Response, NextFunction } from "express";
import type { User } from "@shared/schema";
import { storage } from "../storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";

// Cookie name for auth token
const AUTH_COOKIE_NAME = "auth_token";
const REFRESH_COOKIE_NAME = "refresh_token";

// Secrets - MUST be set in production via environment variables
let JWT_SECRET = process.env.JWT_SECRET;
let JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// In production, we REQUIRE these secrets
const isProduction = process.env.NODE_ENV === "production";

if (!JWT_SECRET) {
  if (isProduction) {
    // In production, use a fallback but log critical error
    console.error(
      "❌ CRITICAL: JWT_SECRET not set in production environment! Authentication will not work. Configure JWT_SECRET in environment variables."
    );
    JWT_SECRET = "fallback-insecure-key-for-production";
  } else {
    console.warn(
      "⚠️  JWT_SECRET not set. Using temporary development value. Set JWT_SECRET in .env for production."
    );
    JWT_SECRET = "dev-temporary-secret-key-do-not-use";
  }
}

if (!JWT_REFRESH_SECRET) {
  if (isProduction) {
    console.error(
      "❌ CRITICAL: JWT_REFRESH_SECRET not set in production! Refresh tokens will not work. Configure JWT_REFRESH_SECRET in environment variables."
    );
    JWT_REFRESH_SECRET = "fallback-insecure-refresh-key-for-production";
  } else {
    console.warn(
      "⚠️  JWT_REFRESH_SECRET not set. Using temporary development value. Set JWT_REFRESH_SECRET in .env for production."
    );
    JWT_REFRESH_SECRET = "dev-temporary-refresh-key-do-not-use";
  }
}

const JWT_EXPIRY = "15m";
const REFRESH_JWT_EXPIRY = "7d";

/**
 * Extend Express Request to include user
 */
declare global {
  namespace Express {
    interface Request {
      user?: any;
      userId?: string;
    }
  }
}

/**
 * Create JWT token
 */
export function createToken(userId: string, isRefresh = false): string {
  if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
    throw new Error("JWT secrets not configured. Check environment variables.");
  }
  const secret = isRefresh ? JWT_REFRESH_SECRET : JWT_SECRET;
  const expiresIn = isRefresh ? REFRESH_JWT_EXPIRY : JWT_EXPIRY;
  
  return jwt.sign(
    { userId, isRefresh },
    secret,
    { expiresIn }
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string, isRefresh = false): { userId: string } | null {
  try {
    if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
      throw new Error("JWT secrets not configured. Check environment variables.");
    }
    const secret = isRefresh ? JWT_REFRESH_SECRET : JWT_SECRET;
    const decoded = jwt.verify(token, secret) as { userId: string; isRefresh: boolean };
    
    // Ensure token type matches what we expect
    if (decoded.isRefresh !== isRefresh) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Set auth cookies
 */
export function setAuthCookies(res: Response, userId: string): void {
  const token = createToken(userId, false);
  const refreshToken = createToken(userId, true);
  
  const isProduction = process.env.NODE_ENV === "production";
  
  // Em produção: secure=true (HTTPS obrigatório), sameSite=none permite cross-domain
  // Em dev: secure=false (localhost), sameSite=lax
  const secure = isProduction;
  const sameSite = isProduction ? "none" : "lax"; // none é necessário para rewrites do Firebase
  
  const cookieOptions = {
    httpOnly: true,
    secure,
    sameSite: sameSite as "lax" | "none" | "strict",
    path: "/",
    domain: isProduction ? ".run.app" : undefined, // Permite cookies no Cloud Run
  };
  
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  
  // Também enviar token no body para o frontend guardar no localStorage como backup
  console.log(`🍪 Cookies setados para ${userId} (secure=${secure}, sameSite=${sameSite}, domain=${cookieOptions.domain || 'default'})`);
}

/**
 * Clear auth cookies
 */
export function clearAuthCookies(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
}

/**
 * Extract user from request (from cookies or header)
 */
export function extractUser(req: Request): { userId: string } | null {
  const cookieKeys = Object.keys(req.cookies || {});
  // NOTE: req.headers.authorization is automatically lowercased by Express
  const authHeader = req.headers.authorization || req.headers.Authorization as string | undefined;
  
  console.log(`🔍 [AUTH] Extracting user...`);
  console.log(`   Cookies found: ${cookieKeys.length > 0 ? cookieKeys.join(', ') : 'NONE'}`);
  console.log(`   Auth Header: ${authHeader ? 'PRESENT' : 'MISSING'}`);
  
  // Try authorization header (Bearer token) - PRIORITY: Header first (more reliable with rewrites)
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    console.log(`✓ [AUTH] Token found in Authorization header`);
    const payload = verifyToken(token, false);
    if (payload) {
      console.log(`✓ [AUTH] Header token verified, userId: ${payload.userId}`);
      return payload;
    }
    console.log(`✗ [AUTH] Header token verification failed`);
  }
  
  // Try cookie as fallback
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (token) {
    console.log(`✓ [AUTH] Token found in cookie (fallback)`);
    const payload = verifyToken(token, false);
    if (payload) {
      console.log(`✓ [AUTH] Cookie token verified, userId: ${payload.userId}`);
      return payload;
    }
    console.log(`✗ [AUTH] Cookie token verification failed`);
  }
  
  console.log(`✗ [AUTH] No valid token found`);
  return null;
}

/**
 * Middleware: Authenticate request
 * Sets req.userId and req.user if authentication succeeds
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const userPayload = extractUser(req);
  
  if (!userPayload) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  
  req.userId = userPayload.userId;
  next();
};

/**
 * Middleware: Authenticate or continue (optional auth)
 * Sets req.userId if authentication succeeds, but doesn't fail
 */
export const authenticateOptional = (req: Request, _res: Response, next: NextFunction): void => {
  const userPayload = extractUser(req);
  if (userPayload) {
    req.userId = userPayload.userId;
  }
  next();
};

/**
 * Middleware: Check admin role
 */
export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userPayload = extractUser(req);
  
  if (!userPayload) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  
  const user = await storage.getUser(userPayload.userId);
  if (!user || user.role !== "admin") {
    res.status(403).json({ message: "Forbidden: Admin access required" });
    return;
  }
  
  req.userId = userPayload.userId;
  req.user = user;
  next();
};

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Setup authentication middleware on express app
 */
export function setupAuthMiddleware(app: Express): void {
  // Parse cookies
  app.use(cookieParser());
  
  // Trust proxy headers from Replit load balancer
  app.set("trust proxy", 1);
}

/**
 * Initialize auth routes
 */
export function registerIndependentAuthRoutes(app: Express): void {
  // POST /api/auth/signup - Register new user
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        res.status(400).json({ message: "Email and password required" });
        return;
      }
      
      // Check if user exists
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        res.status(409).json({ message: "User already exists" });
        return;
      }
      
      // Hash password
      const passwordHash = await hashPassword(password);
      
      // Create user
      const user = await storage.createUser({
        email,
        passwordHash,
        firstName: firstName || "",
        lastName: lastName || "",
        profileImageUrl: null,
      });
      
      // Set cookies
      setAuthCookies(res, user.id);
      
      res.status(201).json({
        success: true,
        userId: user.id,
        email: user.email,
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // POST /api/auth/login - Login with email and password
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const startTime = Date.now();
    let userId = 'unknown';
    let email = 'unknown';
    
    try {
      const { email: inputEmail, password } = req.body;
      email = inputEmail?.substring?.(0, 5) + '***' || 'invalid';
      
      console.log(`[LOGIN] 🔑 Attempt for email: ${email}, IP: ${req.ip || req.connection.remoteAddress}`);
      
      // Validate input
      if (!inputEmail || typeof inputEmail !== "string" || !inputEmail.trim()) {
        console.log(`[LOGIN] ❌ Bad request: missing email`);
        return res.status(400).json({ 
          message: "Email is required and must be a string",
          error: "MISSING_EMAIL"
        });
      }
      if (!password || typeof password !== "string") {
        console.log(`[LOGIN] ❌ Bad request: missing password`);
        return res.status(400).json({ 
          message: "Password is required and must be a string",
          error: "MISSING_PASSWORD"
        });
      }
      
      // Basic email format validation
      if (!inputEmail.includes("@") || inputEmail.length < 5) {
        console.log(`[LOGIN] ❌ Bad request: invalid email format`);
        return res.status(400).json({ 
          message: "Invalid email format",
          error: "INVALID_EMAIL_FORMAT"
        });
      }
      
      // Get user by email
      let user;
      try {
        user = await storage.getUserByEmail(inputEmail);
        console.log(`[LOGIN] 📊 Database query completed in ${Date.now() - startTime}ms`);
      } catch (dbError: any) {
        console.error(`[LOGIN] 🚨 Database error fetching user: `, {
          message: dbError.message,
          stack: dbError.stack?.substring?.(0, 200),
          email: email,
          duration: Date.now() - startTime
        });
        return res.status(500).json({ 
          message: "Database error",
          error: "DB_ERROR"
        });
      }
      
      if (!user) {
        console.log(`[LOGIN] ❌ User not found: ${email}`);
        return res.status(401).json({ 
          message: "Invalid credentials",
          error: "INVALID_CREDENTIALS"
        });
      }
      
      userId = user.id;
      
      // Verify password
      if (!user.passwordHash) {
        console.log(`[LOGIN] ❌ User has no password hash: ${userId}`);
        return res.status(401).json({ 
          message: "Invalid credentials",
          error: "INVALID_CREDENTIALS"
        });
      }
      
      let validPassword = false;
      const passwordStartTime = Date.now();
      try {
        validPassword = await verifyPassword(password, user.passwordHash);
        console.log(`[LOGIN] 📊 Password verification completed in ${Date.now() - passwordStartTime}ms`);
      } catch (pwError: any) {
        console.error(`[LOGIN] 🚨 Password verification error: `, {
          message: pwError.message,
          userId: userId,
          duration: Date.now() - passwordStartTime
        });
        return res.status(500).json({ 
          message: "Authentication error",
          error: "AUTH_ERROR"
        });
      }
      
      if (!validPassword) {
        console.log(`[LOGIN] ❌ Invalid password for user: ${userId}`);
        return res.status(401).json({ 
          message: "Invalid credentials",
          error: "INVALID_CREDENTIALS"
        });
      }
      
      // Create token
      let token;
      const tokenStartTime = Date.now();
      try {
        token = createToken(user.id, false);
        console.log(`[LOGIN] 📊 Token creation completed in ${Date.now() - tokenStartTime}ms`);
      } catch (tokenError: any) {
        console.error(`[LOGIN] 🚨 Token creation error: `, {
          message: tokenError.message,
          userId: userId,
          duration: Date.now() - tokenStartTime
        });
        return res.status(500).json({ 
          message: "Token generation failed",
          error: "TOKEN_ERROR"
        });
      }
      
      // Set cookies
      try {
        setAuthCookies(res, user.id);
      } catch (cookieError: any) {
        console.error(`[LOGIN] ⚠️  Cookie setting error (non-critical): `, {
          message: cookieError.message,
          userId: userId
        });
        // Don't return error here, cookies are nice-to-have
      }
      
      const totalDuration = Date.now() - startTime;
      console.log(`[LOGIN] ✅ Success for user: ${userId}, total duration: ${totalDuration}ms`);
      
      res.json({
        success: true,
        userId: user.id,
        email: user.email,
        token,
      });
    } catch (error: any) {
      const totalDuration = Date.now() - startTime;
      console.error("[LOGIN] 🚨 Unexpected error:", {
        message: error.message,
        stack: error.stack?.substring?.(0, 200),
        email: email,
        userId: userId,
        duration: totalDuration
      });
      res.status(500).json({ 
        message: "Internal server error",
        error: "INTERNAL_ERROR"
      });
    }
  });
  
  // POST /api/auth/refresh - Refresh access token
  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
      
      if (!refreshToken) {
        res.status(401).json({ message: "Refresh token missing" });
        return;
      }
      
      const payload = verifyToken(refreshToken, true);
      if (!payload) {
        res.status(401).json({ message: "Invalid refresh token" });
        return;
      }
      
      // Verify user still exists
      const user = await storage.getUser(payload.userId);
      if (!user) {
        res.status(401).json({ message: "User not found" });
        return;
      }
      
      // Set new cookies
      setAuthCookies(res, payload.userId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Refresh error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // POST /api/auth/logout - Clear auth cookies
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    clearAuthCookies(res);
    res.json({ success: true });
  });
  
  // GET /api/auth/me - Get current user
  app.get("/api/auth/me", authenticate, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      
      res.json({
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        profileImageUrl: user.profileImageUrl,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}
