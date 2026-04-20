# Semar Project Handoff — Status Update (April 20, 2026)

## Current Condition: Healthy & Functional
The Semar project is well past the initial setup phase and is currently a functional, data-driven prototype.

### 1. Operational Status
* **Live Environment:** The website is running in a Docker container (`semar-app`) and is accessible at [http://bnimahardika.qd.je/langit/semar](http://bnimahardika.qd.je/langit/semar).
* **Infrastructure:** It is reverse-proxied by Caddy (managed by `mahardika-caddy`) and uses an SQLite database (`dev.db`).
* **Recent Activity:** System logs show the application is active and successfully processing database queries and AI-driven interpretations.

### 2. Core Features & Integration
* **BaZi Engine:** Successfully integrated with `bazi-mcp` for precise classical Chinese astrology calculations (Four Pillars, Ten Gods, etc.).
* **AI Interpretation:** Powered by the **MiniMax M2.7** model, which translates technical BaZi data into psychological insights.
* **Persistent Storage:** A local file-based system for "People" and "Cases" is fully operational.
    * **Current Data:** 2 person profiles (Budi and Lucky) and 4 analysis cases are currently stored.
* **Knowledge Base:** The project has a well-developed internal library in `/root/semar/knowledge/`, covering:
    * **Day Masters:** Substantial content for all 10 types (Jia, Yi, Bing, etc.).
    * **Ten Gods:** Detailed files for all roles (Direct Officer, Eating God, etc.).
    * **Elements:** Core elemental theory is documented.

### 3. Technical Stack
* **Framework:** Next.js 15 (App Router) & React 19.
* **Styling:** Tailwind CSS with Framer Motion for a "P5 Retro" aesthetic.
* **ORM:** Prisma for database management.

### 4. Identified Next Steps
* **Translation:** Mapping "Symbolic Stars" (`神煞`) from Chinese to English in `bazi-utils.ts`.
* **Knowledge Expansion:** While Day Masters and Ten Gods are well-documented, other sections like "Luck Pillars" and "Interactions" need more detailed content.
* **Database Migration:** Transition from local JSON/SQLite to a more robust production database like PostgreSQL for scaling.

## Summary of Previous Work
1. **BaZi Engine Integration (`bazi-mcp`)**: Connected via stdio MCP protocol.
2. **Bilingual Translation Layer**: Created `src/lib/bazi-utils.ts` for term mapping.
3. **Permanent Person Storage**: Implemented `src/lib/person-store.ts` for profile management.
4. **Technical Fixes**: Resolved `tsconfig.json` path alias issues and React 19/Next.js 15 dependency conflicts.
