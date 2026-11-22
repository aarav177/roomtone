# Roomtone

A real-time chat application built for a Real-Time Systems Engineering minor project.

- **Frontend:** React (Vite) + socket.io-client
- **Backend:** Node.js, Express (REST) and Socket.io (live events)
- **Database:** MongoDB (Mongoose)

## Features

- Real-time, two-way messaging
- Chat rooms (join, leave, create new rooms live)
- Messages saved in MongoDB with timestamps, loaded as history when you open a room
- Online/offline presence, with "last seen" for offline users
- Typing indicators
- Socket logic and REST logic kept in separate layers

## Run it locally

You need Node.js 18+ and MongoDB (local, or a free Atlas cluster).

```bash
# 1. Server
cd server
npm install
cp .env.example .env     # edit MONGODB_URI if you use Atlas
npm run dev              # http://localhost:4000

# 2. Client (new terminal)
cd client
npm install
npm run dev              # http://localhost:5173
```

Open http://localhost:5173 in two browser windows (use a private window for the second), sign in with different usernames, and chat.

## Architecture

```
React client
   |  REST (login, rooms, message history)        Socket.io (live events)
   v                                               v
routes/  ----------------------\        /---------------------- sockets/
(HTTP only)                     v      v                        (events only)
                              services/   <- all business logic and DB access
                                  |
                               models/ (Mongoose) -> MongoDB
```

**Separation of socket and API logic.** `routes/` handles HTTP and `sockets/` handles events. Neither touches the database directly. Both call `services/`, so a rule such as "messages are trimmed and limited to 1000 characters" lives in exactly one place.

| Folder | Job |
|---|---|
| `server/src/routes` | REST endpoints: login, list/create rooms, message history |
| `server/src/sockets` | Socket.io auth middleware, chat events, presence events |
| `server/src/services` | Business logic and database access, shared by both layers |
| `server/src/models` | Mongoose schemas: User, Room, Message |

### Socket event lifecycle

| Phase | Event | What happens |
|---|---|---|
| Connect | `connection` | Middleware checks the user id. Presence is updated and a `presence:snapshot` is sent to the new socket |
| Join room | `room:join` | `socket.join(roomId)`, then `room:user-joined` goes to the others in the room |
| Send | `message:send` | Validate, **save to MongoDB**, then broadcast `message:new` to the room |
| Typing | `typing` | Relayed to the others in the room |
| Leave room | `room:leave` | `socket.leave(roomId)`, then `room:user-left` |
| Disconnect | `disconnecting` / `disconnect` | Rooms are notified; if it was the user's last connection, they are marked offline and `presence:update` is broadcast |

Messages are saved **before** they are broadcast, so what people see is always what is stored.

### Presence

A user can have several tabs open, so the server keeps a set of socket ids per user (`presenceService`). A user goes online when their first connection opens and offline only when their last one closes. The status and `lastSeen` are stored in MongoDB.

### REST endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/login` | Sign in with a username (creates the user if new) |
| GET | `/api/rooms` | List rooms |
| POST | `/api/rooms` | Create a room (broadcasts `room:created`) |
| GET | `/api/rooms/:roomId/messages?before=` | Message history, newest 50, cursor-paginated by `createdAt` |
| GET | `/api/users` | List users with presence |

## Scalability notes

This project runs on one server. Here is what would change to run on many:

1. **Socket.io Redis adapter** (`@socket.io/redis-adapter`). Rooms are tracked per server process, so with several instances a broadcast would only reach users on the same one. The adapter relays events between instances through Redis pub/sub.
2. **Presence in Redis.** The in-memory map in `presenceService.js` would become a Redis set per user, so every instance agrees on who is online.
3. **Sticky sessions** on the load balancer, because Socket.io may start with HTTP long-polling and each request must reach the same instance.
4. **Stateless authentication.** Replace username-only login with passwords plus JWT. The socket middleware would verify the token, so any instance can authenticate any user.
5. **Database.** The `{ room, createdAt }` index already supports fast history queries. At larger scale: pagination (already in the API), a capped history window, and sharding messages by room.
6. **Horizontal scaling of writes.** Messages could be queued (for example Kafka or Redis Streams) and written to MongoDB in batches, so slow writes do not block broadcasts.

## Known limitations

- Login is username-only with no password, so anyone can sign in as any name. This is fine for a demo but not for production (see scalability note 4).
- Message history loads the latest 50 messages. The API supports `before=` for older pages, but the UI does not have a "load more" button yet.

## Project structure

```
roomtone/
├── server/
│   └── src/ { index.js, app.js, config/, models/, routes/, services/, sockets/, utils/ }
└── client/
    └── src/ { App.jsx, api.js, socket.js, hooks/, components/, styles.css }
```
