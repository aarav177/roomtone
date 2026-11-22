// Socket layer entry point. Handlers call the same services the REST routes use.
import { Server } from 'socket.io';
import { findUserById } from '../services/userService.js';
import { registerPresenceHandlers } from './presenceHandlers.js';
import { registerChatHandlers } from './chatHandlers.js';

export function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' },
  });

  // Runs once per connection attempt, before the "connection" event.
  io.use(async (socket, next) => {
    try {
      const user = await findUserById(socket.handshake.auth?.userId);
      if (!user) return next(new Error('Unknown user'));
      socket.data.user = user;
      next();
    } catch (err) {
      next(new Error('Could not authenticate'));
    }
  });

  io.on('connection', (socket) => {
    registerPresenceHandlers(io, socket);
    registerChatHandlers(io, socket);
  });

  return io;
}
