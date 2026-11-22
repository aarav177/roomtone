import { addConnection, removeConnection } from '../services/presenceService.js';
import { listUsers, setPresence } from '../services/userService.js';

export async function registerPresenceHandlers(io, socket) {
  const { user } = socket.data;

  // Register first so a quick disconnect is never missed while we await the database.
  socket.on('disconnect', async () => {
    try {
      if (removeConnection(user.id, socket.id)) {
        io.emit('presence:update', await setPresence(user.id, false));
      }
    } catch (err) {
      console.error('presence disconnect failed:', err);
    }
  });

  try {
    if (addConnection(user.id, socket.id)) {
      io.emit('presence:update', await setPresence(user.id, true));
    }
    socket.emit('presence:snapshot', await listUsers());
  } catch (err) {
    console.error('presence connect failed:', err);
  }
}
