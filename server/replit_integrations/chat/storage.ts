import { db } from "../../db";
import { conversations, messages } from "@shared/schema";
import { eq, desc, and, lt } from "drizzle-orm";

export interface IChatStorage {
  getConversation(id: number): Promise<typeof conversations.$inferSelect | undefined>;
  getAllConversations(): Promise<(typeof conversations.$inferSelect)[]>;
  createConversation(title: string): Promise<typeof conversations.$inferSelect>;
  deleteConversation(id: number): Promise<void>;
  getMessagesByConversation(conversationId: number): Promise<(typeof messages.$inferSelect)[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<typeof messages.$inferSelect>;
  cleanExpiredMessages(): Promise<number>; // Auto-delete expired messages
}

export const chatStorage: IChatStorage = {
  async getConversation(id: number) {
    try {
      const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
      return conversation;
    } catch (error) {
      console.error("[CHAT STORAGE] Error getting conversation:", error);
      throw error;
    }
  },

  async getAllConversations() {
    try {
      return await db.select().from(conversations).orderBy(desc(conversations.createdAt));
    } catch (error) {
      console.error("[CHAT STORAGE] Error getting all conversations:", error);
      throw error;
    }
  },

  async createConversation(title: string) {
    try {
      if (!title || title.trim().length === 0) {
        throw new Error("Título de conversa não pode estar vazio");
      }

      const [conversation] = await db
        .insert(conversations)
        .values({ title: title.trim() })
        .returning();

      if (!conversation) {
        throw new Error("Falha ao criar conversa");
      }

      return conversation;
    } catch (error) {
      console.error("[CHAT STORAGE] Error creating conversation:", error);
      throw error;
    }
  },

  async deleteConversation(id: number) {
    try {
      // Delete messages first (cascade should handle this, but explicit is safer)
      await db.delete(messages).where(eq(messages.conversationId, id));
      // Then delete conversation
      await db.delete(conversations).where(eq(conversations.id, id));
    } catch (error) {
      console.error("[CHAT STORAGE] Error deleting conversation:", error);
      throw error;
    }
  },

  async getMessagesByConversation(conversationId: number) {
    try {
      return await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(messages.createdAt);
    } catch (error) {
      console.error("[CHAT STORAGE] Error getting messages:", error);
      throw error;
    }
  },

  async createMessage(conversationId: number, role: string, content: string) {
    try {
      if (!content || content.trim().length === 0) {
        throw new Error("Conteúdo da mensagem não pode estar vazio");
      }

      if (!["user", "assistant"].includes(role)) {
        throw new Error("Role inválido (deve ser 'user' ou 'assistant')");
      }

      // Set expiration to 24 hours from now
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const [message] = await db
        .insert(messages)
        .values({
          conversationId,
          role,
          content: content.trim(),
          expiresAt,
        })
        .returning();

      if (!message) {
        throw new Error("Falha ao criar mensagem");
      }

      return message;
    } catch (error) {
      console.error("[CHAT STORAGE] Error creating message:", error);
      throw error;
    }
  },

  async cleanExpiredMessages(): Promise<number> {
    try {
      const now = new Date();
      const result = await db
        .delete(messages)
        .where(lt(messages.expiresAt, now))
        .returning();

      console.log("[CHAT STORAGE] Cleaned", result.length, "expired messages");
      return result.length;
    } catch (error) {
      console.error("[CHAT STORAGE] Error cleaning expired messages:", error);
      return 0;
    }
  },
};

// Cleanup task: Run every hour
setInterval(async () => {
  await chatStorage.cleanExpiredMessages().catch((err) => {
    console.error("[CHAT STORAGE] Periodic cleanup failed:", err);
  });
}, 60 * 60 * 1000);

