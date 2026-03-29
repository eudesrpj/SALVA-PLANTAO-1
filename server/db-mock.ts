/**
 * Mock Database - Fallback para desenvolvimento sem PostgreSQL
 * Retorna dados fictícios de teste
 */

const ADMIN_USER = {
  id: "1",
  email: "eudesrpj@gmail.com",
  name: "Admin",
  role: "admin",
  passwordHash: "$2b$10$ynjDNFf0JV2qLl1RKJVZX.VfvhFcGEXuVlRFLv6mK5dMBEgfEi7fa", // Eudes.2020
  createdAt: new Date(),
  updatedAt: new Date(),
};

const TEST_USER = {
  id: "2",
  email: "test@example.com",
  name: "Test User",
  role: "user",
  passwordHash: "$2b$10$pRy8fW2QY.QzU8LqLNW5n.xS6n5S6n5S6n5S6n5S6n5S6n5S6n5S6", // test123
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockDatabase = {
  // Users store
  users: new Map([
    [ADMIN_USER.id, ADMIN_USER],
    [TEST_USER.id, TEST_USER],
  ]),

  // Auth store
  authSessions: new Map(),
  refreshTokens: new Map(),

  // Data store
  prescriptions: new Map(),
  protocols: new Map(),
  checklists: new Map(),

  // Query helpers
  getUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  },

  getUserById(id) {
    return this.users.get(id);
  },

  createUser(data) {
    const id = String(this.users.size + 1);
    const user = { ...data, id, createdAt: new Date(), updatedAt: new Date() };
    this.users.set(id, user);
    return user;
  },

  updateUser(id, data) {
    const user = this.users.get(id);
    if (!user) return null;
    const updated = { ...user, ...data, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  },

  // Session helpers
  createSession(userId, token) {
    this.authSessions.set(token, {
      userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    return token;
  },

  getSession(token) {
    const session = this.authSessions.get(token);
    if (!session) return null;
    if (session.expiresAt < new Date()) {
      this.authSessions.delete(token);
      return null;
    }
    return session;
  },

  deleteSession(token) {
    this.authSessions.delete(token);
  },

  // Generic data store
  store(key, value) {
    this.data = this.data || {};
    this.data[key] = value;
  },

  get(key) {
    this.data = this.data || {};
    return this.data[key];
  },

  // Prescription helpers
  getPrescriptions(userId) {
    return Array.from(this.prescriptions.values()).filter(
      (p) => p.userId === userId
    );
  },

  createPrescription(data) {
    const id = String(this.prescriptions.size + 1);
    const prescription = { ...data, id, createdAt: new Date() };
    this.prescriptions.set(id, prescription);
    return prescription;
  },
};

export default mockDatabase;
