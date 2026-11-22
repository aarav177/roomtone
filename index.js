import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { connectDb } from './config/db.js';
import { initSockets } from './sockets/index.js';
import { ensureDefaultRooms } from './services/roomService.js';
import { resetAllPresence } from './services/userService.js';

const PORT = process.env.PORT || 4000;

async function main() {
  await connectDb();
  await ensureDefaultRooms();
  // The in-memory presence map is empty on boot, so nobody can be online yet.
  await resetAllPresence();

  const server = http.createServer(app);
  const io = initSockets(server);
  // Lets REST controllers broadcast events (e.g. a new room) without importing socket code.
  app.set('io', io);

  server.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
