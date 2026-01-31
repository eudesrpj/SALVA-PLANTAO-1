import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";
import { authenticate } from "../../auth/independentAuth";
import { z } from "zod";

let openai: OpenAI | null = null;

if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "https://api.openai.com/v1",
  });
}

// Validation schemas
const createConversationSchema = z.object({
  title: z.string().min(1, "Título obrigatório").max(255, "Título muito longo").optional(),
});

const createMessageSchema = z.object({
  content: z.string().min(1, "Mensagem não pode estar vazia").max(5000, "Mensagem muito longa"),
});

// Rate limiting helper (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // Max messages per minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  userLimit.count++;
  if (userLimit.count > RATE_LIMIT_MAX) {
    return false;
  }

  return true;
}

// Content validation and sanitization helper
function sanitizeContent(content: string): string {
  // Remove HTML tags and scripts
  let sanitized = content
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .trim();

  // Limit consecutive whitespace
  sanitized = sanitized.replace(/\s+/g, " ");

  return sanitized;
}

// Check for suspicious patterns (CPF, email without consent)
function isSuspiciousContent(content: string): boolean {
  // CPF pattern (simple)
  if (/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/.test(content)) {
    return true;
  }

  // Email pattern (simple)
  if (/@/.test(content) && /\w+@\w+\.\w+/.test(content)) {
    return true;
  }

  // Phone number pattern
  if (/\(\d{2}\)\s?\d{4,5}-?\d{4}|^1[1-9]\d{8}$/.test(content)) {
    return true;
  }

  return false;
}

export function registerChatRoutes(app: Express): void {
  // Get all conversations
  app.get("/api/conversations", authenticate, async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("[CHAT] Error fetching conversations:", error);
      res.status(500).json({ error: "Falha ao carregar conversas" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: "ID de conversa inválido" });
      }

      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversa não encontrada" });
      }

      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("[CHAT] Error fetching conversation:", error);
      res.status(500).json({ error: "Falha ao carregar conversa" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", authenticate, async (req: Request, res: Response) => {
    try {
      const validation = createConversationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0]?.message || "Dados inválidos" });
      }

      const title = validation.data.title || "Nova Conversa";
      const sanitizedTitle = sanitizeContent(title);

      if (!sanitizedTitle) {
        return res.status(400).json({ error: "Título não pode estar vazio" });
      }

      const conversation = await chatStorage.createConversation(sanitizedTitle);
      res.status(201).json(conversation);
    } catch (error) {
      console.error("[CHAT] Error creating conversation:", error);
      res.status(500).json({ error: "Falha ao criar conversa" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: "ID de conversa inválido" });
      }

      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("[CHAT] Error deleting conversation:", error);
      res.status(500).json({ error: "Falha ao deletar conversa" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;

      // Check rate limit
      if (!checkRateLimit(userId)) {
        return res.status(429).json({ error: "Muitas mensagens enviadas. Tente novamente em alguns segundos." });
      }

      // Validate input
      const validation = createMessageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0]?.message || "Dados inválidos" });
      }

      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "ID de conversa inválido" });
      }

      // Sanitize content
      const sanitizedContent = sanitizeContent(validation.data.content);

      // Check if OpenAI is available
      if (!openai) {
        // Fallback: Return a helpful message instead of error
        console.warn("[CHAT] OpenAI not configured, using fallback response");
        await chatStorage.createMessage(conversationId, "user", sanitizedContent);

        const fallbackResponse = 
          "Desculpe, o assistente de IA está temporariamente indisponível. " +
          "Estamos trabalhando para restaurar este serviço. " +
          "Por enquanto, você pode consultar a calculadora de medicamentos ou o painel de emergência.";

        await chatStorage.createMessage(conversationId, "assistant", fallbackResponse);

        return res.status(200).json({
          status: "fallback",
          message: fallbackResponse,
        });
      }

      // Save user message
      await chatStorage.createMessage(conversationId, "user", sanitizedContent);

      // Get conversation history for context (limit to last 20 messages)
      const messages = await chatStorage.getMessagesByConversation(conversationId);
      const recentMessages = messages.slice(-20);
      const chatMessages = recentMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Access-Control-Allow-Origin", "*");

      try {
        // Stream response from OpenAI
        const stream = await openai.chat.completions.create({
          model: "gpt-4o-mini", // Updated to available model
          messages: chatMessages,
          stream: true,
          max_completion_tokens: 2048,
          temperature: 0.7,
        });

        let fullResponse = "";
        let hasError = false;

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullResponse += content;
            res.write(`data: ${JSON.stringify({ content, status: "streaming" })}\n\n`);
          }
        }

        if (fullResponse.trim()) {
          // Save assistant message
          await chatStorage.createMessage(conversationId, "assistant", fullResponse);
          res.write(`data: ${JSON.stringify({ done: true, status: "success" })}\n\n`);
        } else {
          hasError = true;
          res.write(`data: ${JSON.stringify({ error: "Resposta vazia do assistente", status: "error" })}\n\n`);
        }

        res.end();
      } catch (aiError: any) {
        console.error("[CHAT] OpenAI API error:", aiError.message);

        if (res.headersSent) {
          const errorMessage = aiError.status === 429 
            ? "Limite de requisições atingido. Tente novamente em alguns momentos."
            : aiError.status === 401 
            ? "Erro de autenticação com o serviço de IA."
            : "Erro ao processar sua mensagem.";

          res.write(`data: ${JSON.stringify({ error: errorMessage, status: "error" })}\n\n`);
          res.end();
        } else {
          res.status(aiError.status || 500).json({ 
            error: aiError.message || "Falha ao enviar mensagem",
            code: aiError.code,
          });
        }
      }
    } catch (error: any) {
      console.error("[CHAT] Error in message handler:", error);

      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Erro interno do servidor", status: "error" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Falha ao enviar mensagem" });
      }
    }
  });

  // Health check endpoint for chat
  app.get("/api/chat/health", (req: Request, res: Response) => {
    res.json({
      status: "ok",
      ai_available: !!openai,
      timestamp: new Date().toISOString(),
    });
  });
}

