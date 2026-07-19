import { useEffect, useRef, useState, useCallback } from 'react';

export function useGameSocket(onMessage) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);
    socketRef.current = socket;

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        onMessageRef.current?.(msg.type, msg.payload);
      } catch {
        // ignore malformed message
      }
    };

    return () => socket.close();
  }, []);

  const send = useCallback((type, payload) => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, payload }));
    }
  }, []);

  return { send, connected };
}
