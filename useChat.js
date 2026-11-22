import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';

function mergeMessages(...lists) {
  const byId = new Map();
  for (const list of lists) for (const msg of list) byId.set(msg.id, msg);
  return [...byId.values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

// Everything about the open room: history, live messages, typing, join/leave.
export function useChat(socket, roomId, connected) {
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState({}); // userId -> username
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Listeners and room membership follow the open room.
  useEffect(() => {
    if (!socket || !roomId) return;
    setMessages([]);
    setTyping({});
    setLoading(true);
    setError('');

    const onNew = (msg) => {
      if (msg.roomId !== roomId) return;
      setMessages((prev) => mergeMessages(prev, [msg]));
      setTyping((prev) => {
        if (!prev[msg.senderId]) return prev;
        const next = { ...prev };
        delete next[msg.senderId];
        return next;
      });
    };
    const onTyping = (evt) => {
      if (evt.roomId !== roomId) return;
      setTyping((prev) => {
        const next = { ...prev };
        if (evt.isTyping) next[evt.userId] = evt.username;
        else delete next[evt.userId];
        return next;
      });
    };

    socket.on('message:new', onNew);
    socket.on('typing', onTyping);
    return () => {
      socket.off('message:new', onNew);
      socket.off('typing', onTyping);
      if (socket.connected) socket.emit('room:leave', { roomId });
    };
  }, [socket, roomId]);

  // Join the room, and load history. Runs again after a reconnect, because the server
  // forgets a socket's rooms when it drops, and we may have missed messages.
  useEffect(() => {
    if (!socket || !roomId) return;
    let cancelled = false;

    if (connected) {
      socket.emit('room:join', { roomId }, (res) => {
        if (!cancelled && !res?.ok) setError(res?.error || 'Could not join this room.');
      });
    }

    api
      .getMessages(roomId)
      .then((history) => {
        if (!cancelled) setMessages((prev) => mergeMessages(history, prev));
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [socket, roomId, connected]);

  const send = useCallback(
    (text) =>
      new Promise((resolve) => {
        if (!socket?.connected) return resolve({ ok: false, error: 'You are offline. Reconnecting...' });
        socket.emit('message:send', { roomId, text }, resolve);
      }),
    [socket, roomId]
  );

  const setTypingState = useCallback(
    (isTyping) => {
      if (socket?.connected && roomId) socket.emit('typing', { roomId, isTyping });
    },
    [socket, roomId]
  );

  return { messages, typing, loading, error, send, setTypingState };
}
