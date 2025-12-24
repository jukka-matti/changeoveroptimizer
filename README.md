# ChangeoverOptimizer AI Agent Package

This package contains everything needed for AI coding agents (Claude Code, Cursor, Copilot) to build ChangeoverOptimizer.

## Quick Start

1. **Browser-Only Development** (Recommended for UI work):
   ```bash
   npm run dev
   ```
   Open `http://localhost:1420/` in any browser. Feature components are lazily loaded to prevent crashes, and Electron APIs are safely shimmed.

2. **Full Electron Development**:
   ```bash
   npm run electron:dev
   ```
   Launches the Electron desktop application with native API support.

3. **Production Build**:
   ```bash
   npm run electron:build
   ```

## File Purposes

### CLAUDE.md

The primary context file. Claude Code and other AI agents automatically read this at session start. Contains:

- Tech stack decisions
- Project structure
- Core types
- Coding standards
- DO NOT list
- Common tasks

**Keep this updated** as you make architectural decisions.

### PRD.md

Product requirements in AI-friendly format. Contains:

- Problem statement
- User personas
- Functional requirements (with acceptance criteria)
- Non-functional requirements
- UI specifications
- Success metrics
- Development phases

**Reference this** when building features.

### .cursorrules

Cursor IDE configuration. Points to CLAUDE.md and adds Cursor-specific rules.

## How to Use with Claude Code

```bash
# Initialize Claude Code in your project
claude init

# Claude will read CLAUDE.md automatically
# Start a conversation:
claude "Let's build the Welcome screen. Check PRD.md FR-01 for requirements."
```

## How to Use with Cursor

1. Open project in Cursor
2. Cursor reads .cursorrules automatically
3. Use @-mentions for context:
   ```
   @CLAUDE.md @PRD.md Build the file import service
   ```

## Project Structure

```
changeoveroptimizer/
├── src/                      # React frontend
├── src-electron/             # Electron backend with SQLite database
├── docs/                     # Documentation
│   ├── technical/            # Architecture, algorithm, data model
│   ├── product/              # PRD, roadmap
│   └── guides/               # Setup guides
├── marketing/                # Website copy, launch plan
├── course/                   # Practitioner course materials
├── PRD.md                    # Product requirements
└── CLAUDE.md                 # Developer guide (read this first!)
```

## Documentation

### For Developers
- [Architecture](docs/technical/ARCHITECTURE.md) - Electron 39.x + React + SQLite
- [Data Model](docs/technical/DATA_MODEL.md) - Database schema & state
- [Algorithm](docs/technical/ALGORITHM.md) - Optimization algorithm
- [SMED Module](docs/technical/SMED_MODULE.md) - Phase 2 feature spec
- [UI Components](docs/technical/UI_COMPONENTS.md) - Component library
- [Design System](docs/technical/DESIGN_SYSTEM.md) - Colors, typography, spacing
- [Licensing](docs/technical/LICENSING.md) - Paddle integration
- [Build](docs/technical/BUILD.md) - Build & distribution

### For Product
- [PRD](PRD.md) - Product requirements
- [Roadmap](docs/product/PHASES.md) - MVP → SMED → Course timeline

### Business & Marketing
- [Marketing Materials](/marketing) - Website copy, launch plan
- [Course Materials](/course) - Practitioner program

Quick reference: [CLAUDE.md](CLAUDE.md)

## Tips for AI Agents

1. **Start with CLAUDE.md** — Always read this first
2. **Check PRD.md** — For feature requirements
3. **Follow patterns** — Look at existing code before creating new
4. **Test your work** — Run `npm run test` after changes
5. **Ask if unclear** — Better to ask than assume

## Example Prompts

### Starting the project
```
Set up the ChangeoverOptimizer project following CLAUDE.md tech stack.
Use the existing Electron + Vite + React + TypeScript setup.
```

### Building a feature
```
Build FR-01 (File Import) from PRD.md.
Follow the parser service pattern from docs/technical/DATA_MODEL.md.
```

### Fixing issues
```
The optimizer is slow for 5000 orders.
Check docs/technical/ALGORITHM.md and optimize the hierarchical grouping.
```

## Updating Context

When you make decisions or learn something:

1. Update CLAUDE.md with new patterns
2. Update PRD.md if requirements change
3. Keep docs/ in sync with implementation

Good context = better AI assistance.

---

*Generated from ChangeoverOptimizer documentation suite (42 documents)*
*December 2024 — RDMAIC Oy*
