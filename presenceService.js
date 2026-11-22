// Tracks live socket connections per user, so several tabs count as one person.
// In-memory is fine for one server. For many servers, move this to Redis (see README).
const connections = new Map(); // userId -> Set<socketId>

// Returns true when this is the user's first open connection (they just came online).
export function addConnection(userId, socketId) {
  const sockets = connections.get(userId) ?? new Set();
  const cameOnline = sockets.size === 0;
  sockets.add(socketId);
  connections.set(userId, sockets);
  return cameOnline;
}

// Returns true when that was the user's last connection (they just went offline).
export function removeConnection(userId, socketId) {
  const sockets = connections.get(userId);
  if (!sockets) return false;
  sockets.delete(socketId);
  if (sockets.size === 0) {
    connections.delete(userId);
    return true;
  }
  return false;
}
