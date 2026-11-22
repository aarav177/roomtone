import { io } from 'socket.io-client';
import { SERVER_URL } from './api.js';

// One socket per signed-in user. The server reads auth.userId in its connection middleware.
export function createSocket(userId) {
  return io(SERVER_URL, { auth: { userId } });
}
