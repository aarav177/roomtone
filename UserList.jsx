import { formatLastSeen } from '../time.js';

function Person({ user, isYou }) {
  return (
    <li className="person">
      <span className={`dot ${user.isOnline ? 'on' : 'off'}`} aria-hidden="true" />
      <span className="person-text">
        <span className="person-name">
          {user.username}
          {isYou && <span className="you"> (you)</span>}
        </span>
        {!user.isOnline && <span className="seen">{formatLastSeen(user.lastSeen)}</span>}
      </span>
      <span className="sr-only">{user.isOnline ? 'online' : 'offline'}</span>
    </li>
  );
}

export default function UserList({ users, currentUserId, open, onClose }) {
  const online = users.filter((u) => u.isOnline);
  const offline = users.filter((u) => !u.isOnline);

  return (
    <aside className={`people ${open ? 'open' : ''}`} aria-label="People">
      <div className="people-head">
        <h2>Online now <span className="count">{online.length}</span></h2>
        <button className="ghost close-people" onClick={onClose}>Close</button>
      </div>
      <ul className="person-list">
        {online.map((u) => (
          <Person key={u.id} user={u} isYou={u.id === currentUserId} />
        ))}
      </ul>
      {offline.length > 0 && (
        <>
          <h2 className="offline-title">Offline</h2>
          <ul className="person-list">
            {offline.map((u) => (
              <Person key={u.id} user={u} isYou={u.id === currentUserId} />
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}
