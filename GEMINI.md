# SEMAR v0.1 — Project Mandates

## Core Purpose
SEMAR is a BaZi (Chinese Astrology) application designed for deep self-reflection. It combines precise classical calculation (via `bazi-mcp`) with modern psychological interpretation.

## Engineering Standards

### 1. Calculation (The Body)
- **Engine:** Use `cantian-ai/bazi-mcp` exclusively for all BaZi calculations (Four Pillars, Ten Gods, Luck Pillars, Symbolic Stars).
- **No Hallucinations:** Never attempt to "calculate" BaZi components within the AI model's logic. All chart data must originate from the MCP server.

### 2. Knowledge (The Mind)
- **Source of Truth:** All interpretations must draw from the `knowledge/` directory (Bilingual: Classical Chinese + Modern English).
- **Injection:** Relevant knowledge fragments should be loaded and injected into the system prompt based on the user's specific chart components.

### 3. Sessions (The Soul)
- **Persistence:** Every session must be saved to `sessions/`.
- **Retrieval:** Users can return to past sessions. Semar must be able to resume a conversation with the context of previous readings.
- **Privacy:** Personal birth data and chat history are sensitive. Keep calculations local when possible.

## Tech Stack
- **Framework:** Next.js 15 (App Router, React 19)
- **Styling:** Vanilla CSS (for the "P5 Retro" aesthetic) + Framer Motion
- **AI Model:** MiniMax M2.7 (via `minimax.ts`)
- **Calculation Engine:** cantian-ai/bazi-mcp (Node.js MCP)
- **Storage:** Local JSON/SQLite for sessions.

## Directory Guide
- `knowledge/`: The source of truth for BaZi theory (MD files).
- `src/lib/bazi-mcp-client.ts`: The bridge to the calculation engine.
- `src/lib/semar-prompt.ts`: Logic for building the system prompt from knowledge fragments.
- `src/lib/session-store.ts`: Local persistence for conversation history.
