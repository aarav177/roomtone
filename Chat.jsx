import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { createSocket } from '../socket.js';
import { usePresence } from '../hooks/usePresence.js';
import { useChat } from '../hooks/useChat.js';
import RoomList from './RoomList.jsx';
import ChatWindow from './ChatWindow.jsx';
import UserList from './UserList.jsx';

export default function Chat({ user, onLogout }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [loadError, setLoadError] = useState('');

  // One socket for the whole session. Closing it is what marks the user offline.
  useEffect(() => {
    const s = createSocket(user.id);
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('connect_error', (err) => {
      setConnected(false);
      // The stored user no longer exists (for example the database was reset).
      if (err.message === 'Unknown user') onLogout();
    });
    setSocket(s);
    return () => s.disconnect();
  }, [user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const addRoom = (room) =>
    setRooms((prev) => (prev.some((r) => r.id === room.id) ? prev : [...prev, room]));

  useEffect(() => {
    api
      .getRooms()
      .then((list) => {
        setRooms(list);
        setActiveRoomId((current) => current ?? list[0]?.id ?? null);
      })
      .catch((err) => setLoadError(err.message));
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('room:created', addRoom);
    return () => socket.off('room:created', addRoom);
  }, [socket]);

  const users = usePresence(socket);
  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.username.localeCompare(b.username)),
    [users]
  );
  const chat = useChat(socket, activeRoomId, connected);
  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? null;
  const onlineCount = users.filter((u) => u.isOnline).length;

  return (
    <div className="shell">
      <RoomList
        rooms={rooms}
        activeId={activeRoomId}
        onSelect={setActiveRoomId}
        onCreated={(room) => {
          addRoom(room);
          setActiveRoomId(room.id);
        }}
      />

      <main className="chat">
        <header className="chat-head">
          <h2>{activeRoom ? `# ${activeRoom.name}` : 'Roomtone'}</h2>
          <span className={`status ${connected ? 'live' : 'down'}`} role="status">
            {connected ? 'Connected' : 'Reconnecting...'}
          </span>
          <span className="spacer" />
          <button className="ghost people-toggle" onClick={() => setPeopleOpen(true)}>
            People ({onlineCount})
          </button>
          <span className="whoami">{user.username}</span>
          <button className="ghost" onClick={onLogout}>Sign out</button>
        </header>
        {loadError && <p className="error banner" role="alert">{loadError}</p>}
        <ChatWindow room={activeRoom} user={user} chat={chat} connected={connected} />
      </main>

      <UserList
        users={sortedUsers}
        currentUserId={user.id}
        open={peopleOpen}
        onClose={() => setPeopleOpen(false)}
      />
    </div>
  );
}
