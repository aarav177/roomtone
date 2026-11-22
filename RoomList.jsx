import { useState } from 'react';
import { api } from '../api.js';

export default function RoomList({ rooms, activeId, onSelect, onCreated }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const create = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const room = await api.createRoom(name);
      setName('');
      onCreated(room);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <nav className="rooms" aria-label="Rooms">
      <h1 className="wordmark">Roomtone</h1>
      <ul className="room-list">
        {rooms.map((room) => (
          <li key={room.id}>
            <button
              className={`room ${room.id === activeId ? 'active' : ''}`}
              aria-current={room.id === activeId ? 'true' : undefined}
              onClick={() => onSelect(room.id)}
            >
              <span className="hash" aria-hidden="true">#</span>
              {room.name}
            </button>
          </li>
        ))}
      </ul>
      <form className="new-room" onSubmit={create}>
        <label htmlFor="new-room" className="sr-only">New room name</label>
        <input
          id="new-room"
          placeholder="New room"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
        />
        <button disabled={name.trim().length < 2}>Add</button>
        {error && <p className="error on-dark" role="alert">{error}</p>}
      </form>
    </nav>
  );
}
