# Solana AI Backend

## Setup

1. Copy `.env.example` to `.env` and fill in your API keys.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the backend in development mode:
   ```bash
   npm run dev
   ```
   Or build and run:
   ```bash
   npm run build
   npm start
   ```

## Endpoints

- `POST /api/chat/message` — General chat (routes to DeepSeek)
- `POST /api/token/price` — Token price lookup
- `POST /api/token/create` — Token creation
- `POST /api/token/swap` — Token swap
- `GET  /api/token/trending` — Trending tokens

## Structure
- `src/services/` — Modular service classes
- `src/routes/` — Express route handlers
- `src/app.ts` — Express app setup
- `src/index.ts` — Entry point

## Reusability
Each service is a class/module that can be imported into other projects. 