// hooks/useWebSocket.js
import { useCallback, useEffect, useRef, useState } from "react";

export const useWebSocket = (url, options = {}) => {
  const {
    reconnect = true,
    reconnectInterval = 3000,
    reconnectAttempts = 5,
    onOpen,
    onMessage,
    onClose,
    onError,
    onReconnect,
    protocols,
    heartbeatInterval = 30000,
    heartbeatMessage = JSON.stringify({ type: "ping" }),
  } = options;

  const [readyState, setReadyState] = useState(WebSocket.CONNECTING);
  const [lastMessage, setLastMessage] = useState(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(true);
  const urlRef = useRef(url);

  // Update URL ref when it changes
  useEffect(() => {
    urlRef.current = url;
  }, [url]);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(heartbeatMessage);
        } catch (err) {
          // ignore send errors during heartbeat
        }
      }
    }, heartbeatInterval);
  }, [heartbeatInterval, heartbeatMessage]);

  const connect = useCallback(() => {
    if (!urlRef.current) return;

    cleanup();

    try {
      const ws = new WebSocket(urlRef.current, protocols);
      wsRef.current = ws;

      ws.onopen = (event) => {
        // 
        setReadyState(WebSocket.OPEN);
        reconnectAttemptsRef.current = 0;
        setReconnectCount(0);
        startHeartbeat();
        onOpen?.(event);
      };

      ws.onmessage = (event) => {
        setLastMessage(event);
        onMessage?.(event);
      };

      ws.onerror = (event) => {
        // console.error('WebSocket error:', event);
        onError?.(event);
      };

      ws.onclose = (event) => {
        // 
        setReadyState(WebSocket.CLOSED);
        cleanup();
        onClose?.(event);

        // Attempt reconnection if enabled and not manually closed
        if (
          reconnect &&
          shouldReconnectRef.current &&
          reconnectAttemptsRef.current < reconnectAttempts
        ) {
          reconnectAttemptsRef.current += 1;
          const currentAttempt = reconnectAttemptsRef.current;
          setReconnectCount(currentAttempt);

          onReconnect?.(currentAttempt);

          // Exponential backoff
          const delay = Math.min(
            reconnectInterval * Math.pow(1.5, currentAttempt - 1),
            30000,
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (error) {
      // console.error('Failed to create WebSocket:', error);
    }
  }, [
    protocols,
    reconnect,
    reconnectInterval,
    reconnectAttempts,
    onOpen,
    onMessage,
    onError,
    onClose,
    onReconnect,
    cleanup,
    startHeartbeat,
  ]);

  const sendMessage = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = typeof data === "string" ? data : JSON.stringify(data);
      wsRef.current.send(message);
    } else {
      // console.warn('WebSocket is not connected. Message not sent.');
    }
  }, []);

  const close = useCallback(() => {
    shouldReconnectRef.current = false;
    cleanup();
    if (wsRef.current) {
      try {
        wsRef.current.close(1000, "Client closing connection");
      } catch (err) {
        // ignore
      }
      wsRef.current = null;
    }
  }, [cleanup]);

  // Connect on mount and when URL changes
  useEffect(() => {
    if (url) {
      shouldReconnectRef.current = true;
      connect();
    }

    return () => {
      shouldReconnectRef.current = false;
      cleanup();
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (err) {
          // ignore
        }
        wsRef.current = null;
      }
    };
  }, [url, connect, cleanup]);

  return {
    sendMessage,
    readyState,
    isConnected: readyState === WebSocket.OPEN,
    lastMessage,
    reconnectCount,
    close,
  };
};
