# Project Proposals

## 1. Next Tasks

Based on the current status (Frontend & Game Logic mostly complete), the priority is **Backend Integration**.

### 1.1. Backend Server Implementation
- **Goal**: Create a functional Express server that hosts the Game Engine and communicates with the Client.
- **Tasks**:
    - Initialize `src/server` with Express and Socket.IO.
    - Integrate `src/game` logic into the server.
    - Implement WebSocket events for:
        - `join_game`
        - `action_submit`
        - `game_update` (broadcasting state)

### 1.2. Local Development Environment
- **Goal**: Enable full-stack development without relying on external services (Supabase/Upstash) initially.
- **Tasks**:
    - Add `docker-compose.yml` for local PostgreSQL and Redis.
    - Update `.env` to point to local services by default.

## 2. Documentation Modifications

### 2.1. Add `docs/system/local_development.md`
- **Reason**: The current docs focus heavily on GCP deployment. A guide for local development is needed for contributors.
- **Content**:
    - Prerequisites (Node, Docker).
    - Setup steps (`npm install`, `docker-compose up`).
    - Running the app (`npm run dev`).

### 2.2. Update `docs/system/architecture.md`
- **Reason**: Clarify the relationship between `src/game` (shared logic) and the server/client.
- **Content**:
    - Explicitly define `src/game` as a shared module.
    - Diagram showing how Server imports Game Engine and Client imports Types/Utils (if applicable).

## 3. System Architecture Modifications

### 3.1. Monorepo Structure Optimization
- **Proposal**: Ensure `src/game` is treated as a shared package.
- **Action**:
    - Create `src/game/package.json`.
    - Add `src/game` to `workspaces` in root `package.json`.
    - This allows `src/server` and `src/client` to import it as a dependency (e.g., `@gmless-trpg/game`).

### 3.2. Local-First Database Strategy
- **Proposal**: Use local Docker containers for DB/Redis during development instead of connecting to remote Supabase/Upstash.
- **Benefit**: Faster iteration, works offline, no credential management issues for new devs.
- **Action**: Add `docker-compose.yml` and update `README.md`.

### 3.3. API Specification
- **Proposal**: Formalize the WebSocket events and REST API.
- **Action**: Create `docs/api_specification.md` defining the JSON payloads for all events.
