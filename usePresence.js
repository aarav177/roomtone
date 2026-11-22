import { useEffect, useState } from 'react';

// Keeps the list of users, with live online/offline status, in sync with the server.
export function usePresence(socket) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const onSnapshot = (list) => setUsers(list);
    const onUpdate = (user) =>
      setUsers((prev) =>
        prev.some((u) => u.id === user.id)
          ? prev.map((u) => (u.id === user.id ? user : u))
          : [...prev, user]
      );

    socket.on('presence:snapshot', onSnapshot);
    socket.on('presence:update', onUpdate);
    return () => {
      socket.off('presence:snapshot', onSnapshot);
      socket.off('presence:update', onUpdate);
    };
  }, [socket]);

  return users;
}
