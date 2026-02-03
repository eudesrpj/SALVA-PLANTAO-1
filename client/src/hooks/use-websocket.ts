import { useEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { tokenStorage } from "@/lib/queryClient";
import { playChatSound, playNotificationSound } from "@/lib/soundPlayer";

interface Notification {
  type: string;
  title: string;
  message: string;
  channel?: string;
  senderId?: string;
  senderName?: string;
  timestamp?: string;
  data?: any;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
  clearNotifications: () => void;
  markAsRead: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!user?.id) return;
    
    const token = tokenStorage.get();
    if (!token) {
      console.warn("[WS] No auth token available");
      return;
    }
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    
    ws.onopen = () => {
      // Send auth with JWT token
      ws.send(JSON.stringify({ type: "auth", token }));
      console.log("[WS] Auth message sent");
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "auth_failed") {
          console.error("[WS] Auth failed:", data.error);
          ws.close(1008, "Authentication failed");
          return;
        }
        
        if (data.type === "connected") {
          setIsConnected(true);
          console.log("[WS] Connected:", data.userId);
          // Reset heartbeat timeout
          if (pingTimeoutRef.current) clearTimeout(pingTimeoutRef.current);
        } else if (data.type === "new_message" || data.type === "new_support_message") {
          setNotifications(prev => [data, ...prev].slice(0, 50));
          setUnreadCount(prev => prev + 1);
          playChatSound();
        } else if (data.type === "notification") {
          setNotifications(prev => [data, ...prev].slice(0, 50));
          setUnreadCount(prev => prev + 1);
          playNotificationSound();
        }
      } catch (error) {
        console.error("[WS] Message parse error:", error);
        // Ignore parse errors
      }
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      console.log("[WS] Disconnected");
      // Attempt to reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    };
    
    ws.onerror = (error) => {
      console.error("[WS] Connection error:", error);
      ws.close();
    };
    
    wsRef.current = ws;
  }, [user?.id]);

  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingTimeoutRef.current) {
        clearTimeout(pingTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return {
    isConnected,
    notifications,
    unreadCount,
    clearNotifications,
    markAsRead,
  };
}
