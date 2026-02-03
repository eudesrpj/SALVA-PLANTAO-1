import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { verifyToken } from "./auth/independentAuth";

interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  subscribedRooms: Set<number>;
  heartbeatInterval: NodeJS.Timeout;
}

const clients: Map<string, ConnectedClient> = new Map();

export function setupWebSocket(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    let userId: string | null = null;
    let authenticated = false;

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Auth message with JWT token validation
        if (message.type === "auth" && message.token && !authenticated) {
          const payload = verifyToken(message.token, false);
          
          if (!payload || !payload.userId) {
            ws.send(JSON.stringify({ type: "auth_failed", error: "Invalid token" }));
            ws.close(1008, "Unauthorized");
            return;
          }
          
          userId = payload.userId;
          authenticated = true;
          
          // Close old connection for this user if exists
          const oldClient = clients.get(userId);
          if (oldClient && oldClient.ws !== ws) {
            clearInterval(oldClient.heartbeatInterval);
            oldClient.ws.close(1000, "New connection established");
          }
          
          // Setup heartbeat to keep connection alive
          const heartbeatInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.ping();
            }
          }, 30000); // Every 30 seconds
          
          clients.set(userId, { ws, userId, subscribedRooms: new Set(), heartbeatInterval });
          ws.send(JSON.stringify({ type: "connected", userId, timestamp: new Date().toISOString() }));
          console.log(`[WS] User authenticated: ${userId}`);
        }

        if (message.type === "chat_subscribe" && message.roomId && userId && authenticated) {
          const client = clients.get(userId);
          if (client) {
            client.subscribedRooms.add(Number(message.roomId));
            console.log(`[WS] User ${userId} subscribed to room ${message.roomId}`);
          }
        }

        if (message.type === "chat_unsubscribe" && message.roomId && userId && authenticated) {
          const client = clients.get(userId);
          if (client) {
            client.subscribedRooms.delete(Number(message.roomId));
            console.log(`[WS] User ${userId} unsubscribed from room ${message.roomId}`);
          }
        }

        if (message.type === "pong") {
          // Client responded to heartbeat - connection is alive
          // No action needed, just confirms connectivity
        }
      } catch (error) {
        console.error("[WS] Message parse error:", error);
        // Ignore parse errors
      }
    });

    ws.on("close", () => {
      if (userId) {
        const client = clients.get(userId);
        if (client) {
          clearInterval(client.heartbeatInterval);
          clients.delete(userId);
          console.log(`[WS] User disconnected: ${userId}`);
        }
      }
    });

    ws.on("error", (error) => {
      console.error("[WS] Connection error:", error);
      if (userId) {
        const client = clients.get(userId);
        if (client) {
          clearInterval(client.heartbeatInterval);
          clients.delete(userId);
        }
      }
    });
  });

  return wss;
}

export function notifyUser(userId: string, notification: {
  type: string;
  title: string;
  message: string;
  channel?: string;
  senderId?: string;
  senderName?: string;
  data?: any;
}) {
  const client = clients.get(userId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify({
      ...notification,
      timestamp: new Date().toISOString(),
    }));
    return true;
  }
  return false;
}

export function notifyAllAdmins(notification: {
  type: string;
  title: string;
  message: string;
  data?: any;
}, adminUserIds: string[]) {
  let notified = 0;
  for (const adminId of adminUserIds) {
    if (notifyUser(adminId, notification)) {
      notified++;
    }
  }
  return notified;
}

export function broadcastToAll(notification: {
  type: string;
  title: string;
  message: string;
  data?: any;
}) {
  let notified = 0;
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        ...notification,
        timestamp: new Date().toISOString(),
      }));
      notified++;
    }
  });
  return notified;
}

export function getConnectedUsers(): string[] {
  return Array.from(clients.keys());
}

export function broadcastToRoom(roomId: number, chatMessage: {
  type: string;
  roomId: number;
  message: any;
}) {
  let notified = 0;
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN && client.subscribedRooms.has(roomId)) {
      client.ws.send(JSON.stringify({
        ...chatMessage,
        timestamp: new Date().toISOString(),
      }));
      notified++;
    }
  });
  return notified;
}
