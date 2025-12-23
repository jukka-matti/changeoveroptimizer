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

## Creating Detailed Docs

The TD (Technical Design) documents should be converted to simpler docs:

| Source | Target |
|--------|--------|
| TD-01: Technical Architecture | docs/ARCHITECTURE.md |
| TD-02: Optimization Algorithm | docs/ALGORITHM.md |
| TD-03: Data Layer | docs/DATA_MODEL.md |
| TD-04: UI Components | docs/UI_COMPONENTS.md |
| TD-05: Licensing & Payments | docs/LICENSING.md |
| TD-06: Build & Distribution | docs/BUILD.md |
| TD-07: Development Phases | docs/PHASES.md |

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
Follow the parser service pattern from docs/DATA_MODEL.md.
```

### Fixing issues
```
The optimizer is slow for 5000 orders.
Check docs/ALGORITHM.md and optimize the hierarchical grouping.
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
