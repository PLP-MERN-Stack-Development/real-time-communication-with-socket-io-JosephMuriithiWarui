# Real-Time Chat Application (MERN + Socket.io)

A lightweight, production-ready real-time chat application built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.io. Supports public rooms, private messaging, typing indicators, reactions, read receipts, and real-time notifications.

## Key Features

- JWT-based authentication (register / login)
- Real-time messaging with Socket.io
- Multiple public chat rooms and private 1:1 chats
- Online/offline presence and typing indicators
- Message reactions and read receipts
- Unread counters, message search, and pagination
- Browser notifications and sound alerts
- Auto-reconnection and presence tracking
- Responsive UI with Tailwind CSS

## Tech Stack

- Frontend: React, TypeScript, Tailwind CSS, Socket.io Client
- Backend: Node.js, Express, Socket.io, MongoDB, Mongoose
- Auth & Security: JWT, bcrypt
- Dev: Vite (frontend), nodemon (backend)

## Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

## Quick Start

1. Clone repository:
   git clone <your-repo-url>
   cd <project-directory>

2. Install dependencies (server and client):
   npm install
   cd client && npm install

3. Copy env template and configure:
   cp .env.example .env
   # Set at minimum:
   # MONGODB_URI=your_mongodb_connection_string
   # JWT_SECRET=your_jwt_secret
   # PORT=3001
   # CLIENT_URL=http://localhost:5173

4. Run in development:
   # From project root (or run two terminals)
   npm run dev:server      # starts backend on PORT (default 3001)
   npm run dev             # starts frontend (Vite) on 5173

5. Open app:
   http://localhost:5173

## Scripts (suggested)

- npm run dev:server — start backend with nodemon
- npm run dev — start frontend (Vite)
- npm run build — build frontend for production
- npm start — start production server

Adjust scripts in package.json to match your repo layout if needed.

## Environment Variables

- MONGODB_URI — MongoDB connection string
- JWT_SECRET — Signing key for JWTs
- PORT — Backend server port
- CLIENT_URL — Frontend origin for CORS and notifications

## API Endpoints (HTTP)

Authentication
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

Messages
- GET /api/messages/room/:room  (supports pagination)
- GET /api/messages/private/:userId
- GET /api/messages/search?query=...
- POST /api/messages/:messageId/read

Users
- GET /api/users
- GET /api/users/:userId/unread

Protect endpoints with auth middleware that validates JWT.

## Socket Events

Client -> Server
- join-room, leave-room
- send-message, send-private-message
- typing-start, typing-stop
- add-reaction, message-read

Server -> Client
- new-message, new-private-message
- user-typing, user-stopped-typing
- notification, user-status-change
- reaction-updated, message-read-receipt

Authenticate socket connections and emit user presence events on connect/disconnect.

## Project Structure (recommended)

server/
- index.js / server.js
- models/ (User, Message, Room)
- routes/ (auth, messages, users)
- middleware/ (auth)
- sockets/ (socket handlers)

client/ (src/)
- components/ (Auth, Chat, Sidebar, MessageList, MessageInput)
- context/ (AuthContext, ChatContext)
- services/ (api.ts, socket.ts)
- utils/ (date.ts, formatters)

## Production Notes

- Build frontend (npm run build) and serve static files from backend or deploy separately.
- Secure env vars and use HTTPS in production.
- Configure CORS to allow frontend origin only.
- Limit socket reconnection attempts and apply rate limiting where needed.

## Security

- Hash passwords with bcrypt
- Use short-lived JWTs and refresh strategy if required
- Validate and sanitize inputs server-side
- Protect socket endpoints with token authentication

## Contributing

- Fork the repo, create a feature branch, and open a PR.
- Run linters and tests before submitting.
- Document breaking changes in the PR description.

## License

MIT