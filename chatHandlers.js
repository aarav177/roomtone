import { getRoomOrThrow } from '../services/roomService.js';
import { createMessage } from '../services/messageService.js';

// Every handler takes an optional acknowledgement callback so the client knows if it worked.
const ackOf = (ack) => (typeof ack === 'function' ? ack : () => {});

export function registerChatHandlers(io, socket) {
  const { user } = socket.data;

  socket.on('room:join', async (payload, ack) => {
    const reply = ackOf(ack);
    try {
      const room = await getRoomOrThrow(payload?.roomId);
      socket.join(room.id);
      socket.to(room.id).emit('room:user-joined', { roomId: room.id, user });
      reply({ ok: true });
    } catch (err) {
      reply({ ok: false, error: err.message });
    }
  });

  socket.on('room:leave', (payload, ack) => {
    const roomId = payload?.roomId;
    if (typeof roomId === 'string' && socket.rooms.has(roomId)) {
      socket.leave(roomId);
      socket.to(roomId).emit('room:user-left', { roomId, user });
      socket.to(roomId).emit('typing', { roomId, userId: user.id, username: user.username, isTyping: false });
    }
    ackOf(ack)({ ok: true });
  });

  socket.on('message:send', async (payload, ack) => {
    const reply = ackOf(ack);
    try {
      const roomId = payload?.roomId;
      if (typeof roomId !== 'string' || !socket.rooms.has(roomId)) {
        throw new Error('Join the room before sending messages.');
      }
      // Save first, then broadcast, so everyone sees exactly what was stored.
      const message = await createMessage({ roomId, user, text: payload?.text });
      io.to(roomId).emit('message:new', message);
      reply({ ok: true, message });
    } catch (err) {
      reply({ ok: false, error: err.message });
    }
  });

  socket.on('typing', (payload) => {
    const roomId = payload?.roomId;
    if (typeof roomId !== 'string' || !socket.rooms.has(roomId)) return;
    socket.to(roomId).emit('typing', {
      roomId,
      userId: user.id,
      username: user.username,
      isTyping: Boolean(payload.isTyping),
    });
  });

  // Fires while the socket is still in its rooms, so we can tell them it's leaving.
  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue; // every socket is in a private room named after its id
      socket.to(roomId).emit('room:user-left', { roomId, user });
      socket.to(roomId).emit('typing', { roomId, userId: user.id, username: user.username, isTyping: false });
    }
  });
}
