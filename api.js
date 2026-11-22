// All REST calls live here. Live messaging goes through socket.js instead.
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${SERVER_URL}/api${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('Cannot reach the server. Is it running?');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  login: (username) =>
    request('/login', { method: 'POST', body: JSON.stringify({ username }) }).then((d) => d.user),
  getRooms: () => request('/rooms').then((d) => d.rooms),
  createRoom: (name) =>
    request('/rooms', { method: 'POST', body: JSON.stringify({ name }) }).then((d) => d.room),
  getMessages: (roomId, before) =>
    request(`/rooms/${roomId}/messages${before ? `?before=${encodeURIComponent(before)}` : ''}`).then(
      (d) => d.messages
    ),
};
