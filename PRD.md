# ChangeoverOptimizer PRD

**Product Requirements Document**

Version 1.0 | December 2025

---

## Executive Summary

ChangeoverOptimizer is a desktop application that optimizes production changeover sequences for SME manufacturers. Users import Excel/CSV production orders, configure changeover times, and receive an optimized sequence that minimizes total changeover time. The app works 100% offline with a freemium business model.

---

## Problem Statement

**Who:** Production planners at SME manufacturers (10-500 employees)

**Problem:** Production lines lose significant time when switching between products with different attributes (color, size, material). Most planners sequence orders manually in Excel, leaving optimization opportunities untapped.

**Impact:** A typical plant with 50 daily orders and 20-minute average changeovers wastes 6-10 hours weekly on avoidable changeovers.

**Solution:** Automated sequence optimization that reduces total changeover time by 20-40%.

---

## User Personas

### Primary: Martin (Production Planner)

- **Age:** 35-55
- **Company:** 50-200 employee manufacturer
- **Tech:** Comfortable with Excel, uses basic ERP
- **Pain:** Spends 2+ hours daily on production planning
- **Goal:** Reduce planning time while improving efficiency
- **Quote:** "I know there's a better way, but I don't have time to figure it out."

### Secondary: Anna (Operations Manager)

- **Age:** 40-55
- **Role:** Oversees production, reports to executives
- **Need:** Demonstrable efficiency improvements
- **Goal:** Quick wins that show value
- **Quote:** "Show me the savings in hours and euros."

---

## Scope

### In Scope (V1.0)

| Category | Features |
|----------|----------|
| **Import** | Excel (.xlsx, .xls), CSV, drag-and-drop, sample data |
| **Configuration** | Column mapping, changeover times, attribute priorities |
| **Optimization** | Hierarchical greedy algorithm, 2-opt refinement |
| **Results** | Before/after comparison, savings calculation, sequence preview |
| **Export** | Excel, CSV, clipboard, PDF (Pro) |
| **Licensing** | Free tier, Pro subscription, Paddle payments |
| **Settings** | Language, theme, recent files |

### Out of Scope (V1.0)

- Multi-day/shift planning
- ERP/MES integration
- Cloud sync
- Constraint scheduling (due dates, priorities)
- Machine-specific optimization
- Team collaboration
- Mobile app

### Future (V1.x+)

- Microsoft Teams integration
- Advanced constraints
- Multi-language UI (12 languages)
- Analytics dashboard
- Template marketplace

---

## Functional Requirements

### FR-01: File Import

**User Story:** As a production planner, I want to import my order list from Excel so I can optimize the sequence.

**Acceptance Criteria:**
- [ ] Accepts .xlsx, .xls, .csv, .tsv files
- [ ] Drag-and-drop or file picker
- [ ] Shows preview of first 10 rows
- [ ] Handles files up to 10,000 rows
- [ ] Detects column headers automatically
- [ ] Shows clear error if file is invalid
- [ ] Sample data available for first-time users

**Technical Notes:**
- Use SheetJS (xlsx) for parsing
- Parse in renderer process for <1000 rows, worker for larger files
- Store parsed data in Zustand, not in files

---

### FR-02: Column Mapping

**User Story:** As a planner, I want to select which columns contain order IDs and changeover-relevant attributes.

**Acceptance Criteria:**
- [ ] Dropdown to select Order ID column
- [ ] Multi-select for attribute columns (up to 10)
- [ ] Show sample values for each column
- [ ] Free tier: max 3 attributes (soft limit with upgrade prompt)
- [ ] Persist mapping for same file structure
- [ ] Clear "Next" button to proceed

**Technical Notes:**
- Store column mapping in Zustand
- Auto-detect likely Order ID column (contains unique values)
- Auto-detect likely attribute columns (low cardinality)

---

### FR-03: Changeover Configuration

**User Story:** As a planner, I want to specify how long each type of changeover takes.

**Acceptance Criteria:**
- [ ] Input field per attribute (minutes)
- [ ] Default values (suggest based on typical ranges)
- [ ] Validation: positive numbers only
- [ ] Option to set priority/weight
- [ ] "Apply" button to save and proceed
- [ ] Templates (Pro): Save/load configurations

**Technical Notes:**
- Store config in Zustand
- Templates stored via tauri-plugin-store (Pro only)

---

### FR-04: Optimization

**User Story:** As a planner, I want the system to find the optimal production sequence automatically.

**Acceptance Criteria:**
- [ ] "Optimize" button triggers algorithm
- [ ] Progress indicator for long operations
- [ ] Completes in <5 seconds for 500 orders
- [ ] Completes in <30 seconds for 5000 orders
- [ ] Deterministic: same input = same output
- [ ] Free tier: max 50 orders (soft limit with upgrade prompt)

**Algorithm (see TD-02):**
1. Sort attributes by changeover time (longest first)
2. Group orders hierarchically by attribute values
3. Flatten groups into sequence
4. Apply 2-opt local refinement
5. Calculate total changeover time

---

### FR-05: Results Display

**User Story:** As a planner, I want to see how much time I saved and the new sequence.

**Acceptance Criteria:**
- [ ] Show before/after total changeover time
- [ ] Show savings in minutes and percentage
- [ ] Show optimized sequence as scrollable table
- [ ] Highlight changeovers in sequence
- [ ] Show which attribute caused each changeover
- [ ] Export buttons prominently displayed
- [ ] "Start Over" option

**UI Components:**
- SavingsCard: Big number, percentage, icon
- SequenceTable: Order ID, attributes, changeover time
- ExportBar: Excel, CSV, PDF, Clipboard buttons

---

### FR-06: Export

**User Story:** As a planner, I want to export the optimized sequence to use in my production system.

**Acceptance Criteria:**
- [ ] Excel export (.xlsx): Optimized sequence with changeover times
- [ ] CSV export: Simple tab/comma-separated
- [ ] Clipboard copy: Paste into any application
- [ ] PDF export (Pro): Summary report with statistics
- [ ] All exports include timestamp and original filename

**Technical Notes:**
- Use SheetJS for Excel generation
- Use jsPDF or similar for PDF
- PDF includes: summary stats, sequence table, changeover breakdown

---

### FR-07: Licensing

**User Story:** As a user, I want to unlock unlimited features by subscribing.

**Tiers:**

| Feature | Free | Pro |
|---------|------|-----|
| Max Orders | 50 | Unlimited |
| Max Attributes | 3 | Unlimited |
| Excel/CSV Export | ✅ | ✅ |
| PDF Export | ❌ | ✅ |
| Templates | ❌ | ✅ |
| Summary Statistics | ❌ | ✅ |
| Price | €0 | €19/mo or €149/yr |

**Acceptance Criteria:**
- [ ] Paddle checkout opens in-app or browser
- [ ] License validated once per day when online
- [ ] Offline grace period: 30 days
- [ ] Expired Pro reverts to Free tier (data not lost)
- [ ] Cancel anytime, use until period ends
- [ ] Manage subscription via Paddle portal

**Technical Notes:**
- Store license in tauri-plugin-store (encrypted)
- Validate against Paddle API
- No refunds (cancel anytime philosophy)

---

### FR-08: Settings

**User Story:** As a user, I want to customize my experience.

**Acceptance Criteria:**
- [ ] Theme: Light / Dark / System
- [ ] Language: English (V1.0), more later
- [ ] Recent files list (last 5)
- [ ] Clear recent files option
- [ ] Reset to defaults
- [ ] About screen with version

**Storage:**
- tauri-plugin-store for preferences
- Paths only for recent files (not content)

---

## Non-Functional Requirements

### NFR-01: Performance

| Metric | Target |
|--------|--------|
| App startup | <3 seconds cold start |
| File import (1000 rows) | <2 seconds |
| Optimization (500 orders) | <5 seconds |
| Optimization (5000 orders) | <30 seconds |
| Export generation | <3 seconds |
| Memory usage (idle) | <200 MB |

### NFR-02: Reliability

- App must not crash on invalid files
- App must recover from network errors gracefully
- App must save settings atomically
- App must handle 10,000+ row files without freezing

### NFR-03: Security

- No production data sent to any server
- License validation over HTTPS only
- No analytics or telemetry
- Local files only, no cloud sync
- Paddle handles all payment data

### NFR-04: Usability

- Workflow completable in <5 minutes by new user
- All errors have actionable messages
- Keyboard navigation for power users (V1.0+)
- Screen reader accessible (V1.0+)

### NFR-05: Compatibility

| Platform | Version |
|----------|---------|
| Windows | 10, 11 (x64) |
| macOS | 12+ (Intel, Apple Silicon) |
| Linux | Ubuntu 20.04+ (x64 AppImage) |

---

## User Interface

### Screen Inventory

| Screen | Purpose | Entry |
|--------|---------|-------|
| Welcome | Import file, try sample | App launch |
| Data Preview | Confirm import | After import |
| Column Mapping | Select columns | After preview |
| Changeover Config | Set times | After mapping |
| Optimizing | Progress | During optimization |
| Results | Show savings | After optimization |
| Export | Generate files | From results |
| Settings | Preferences | Header menu |
| Upgrade Modal | Convert to Pro | Feature gates |

### Visual Design

- Clean, professional, minimal
- Blue primary color (#2563eb)
- Light/dark theme support
- shadcn/ui component library
- Tailwind CSS for styling
- Lucide icons

### Key Interactions

1. **Drag-and-drop import** — Drop file on welcome screen
2. **Inline column mapping** — Click to select, see preview
3. **Editable changeover times** — Input fields with validation
4. **One-click export** — Buttons for each format
5. **Soft upgrade prompts** — Non-blocking, dismissable

---

## Success Metrics

### Launch Criteria (MVP)

- [ ] Complete workflow works end-to-end
- [ ] Free tier limits enforced
- [ ] Pro subscription works via Paddle
- [ ] All 3 platforms build and run
- [ ] <5 critical bugs in beta testing

### Post-Launch Metrics

| Metric | Target (90 days) |
|--------|------------------|
| Downloads | 500 |
| Weekly active users | 100 |
| Free → Pro conversion | 5% |
| Avg. changeover reduction | 25% |
| Support tickets/week | <10 |

---

## Development Phases

### Phase 0: Foundation (Week 1)
- Project setup (Tauri + Vite + React)
- Tailwind + shadcn/ui configuration
- Zustand stores
- Tauri commands (IPC)
- Build configuration

### Phase 1: MVP Core (Weeks 2-5)
- Welcome screen + file import
- Data preview
- Column mapping
- Changeover configuration
- Optimization algorithm
- Results display
- Excel/CSV export
- Basic licensing

### Phase 2: Polish (Weeks 6-7)
- PDF export (Pro)
- Templates (Pro)
- Summary statistics (Pro)
- Recent files
- Error handling
- Auto-updates
- Keyboard shortcuts

### Phase 3: Launch (Week 8)
- Beta testing
- Bug fixes
- Documentation
- Website live
- Soft launch

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Algorithm too slow for large files | High | Use Web Workers, optimize algorithm |
| Paddle integration complexity | Medium | Use Paddle.js, test thoroughly |
| Cross-platform build issues | Medium | CI/CD from day 1, test all platforms |
| Low conversion rate | High | Generous free tier, clear value props |
| Support burden | Medium | In-app help, good error messages |

---

## Dependencies

### External Services

- **Paddle** — Payment processing, subscription management
- **GitHub** — Source control, CI/CD, releases

### NPM Packages (Core)

| Package | Purpose |
|---------|---------|
| @tauri-apps/api | Tauri frontend bindings |
| @tauri-apps/plugin-store | Persistent storage |
| @tauri-apps/plugin-updater | Auto-updates |
| react, react-dom | UI framework |
| zustand | State management |
| xlsx | Excel/CSV parsing |
| tailwindcss | Styling |
| @radix-ui/* | Accessible components |
| lucide-react | Icons |
| i18next | Internationalization |

### Rust Crates (src-tauri)

| Crate | Purpose |
|-------|---------|
| tauri | Desktop framework |
| serde | Serialization |
| tokio | Async runtime |

---

## Open Questions

1. ~~Should we use Electron or Tauri?~~ **Decided: Electron** (mature ecosystem, better tooling)
2. ~~What's the free tier limit?~~ **Decided: 50 orders, 3 attributes**
3. ~~Trial period?~~ **Decided: No trial, free tier IS the trial**
4. ~~Refund policy?~~ **Decided: No refunds, cancel anytime**

---

## Appendix

### Related Documents

| Document | Description |
|----------|-------------|
| CLAUDE.md | Project context for AI agents |
| docs/ARCHITECTURE.md | Full technical architecture |
| docs/ALGORITHM.md | Optimization algorithm details |
| docs/DATA_MODEL.md | Storage and state design |
| docs/UI_COMPONENTS.md | React component library |
| docs/LICENSING.md | Paddle integration |
| docs/PHASES.md | Development roadmap |

### Glossary

| Term | Definition |
|------|------------|
| Changeover | Time to switch production line between products |
| Heijunka | Japanese term for production leveling |
| Attribute | Product characteristic that affects changeover (color, size, etc.) |
| Sequence | Order in which products are manufactured |
| TSP | Traveling Salesman Problem (related algorithm class) |

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-20 | RDMAIC Oy | Initial PRD for AI coding agents |
