# TD-07: Development Phases

**From MVP to V1.0 to Future**

---

## Purpose

This document defines what gets built when. It answers:
- What's the absolute minimum to launch (MVP)?
- What completes V1.0?
- What comes in V1.x and beyond?

---

## Philosophy

### The 80/20 Rule

> **20% of features deliver 80% of value.**

ChangeoverOptimizer's core value is simple: **Import → Optimize → Export**. Everything else is enhancement.

### Launch Fast, Iterate Often

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   DEVELOPMENT TIMELINE                                                      │
│   ─────────────────────────────────────────────────────────────────────────│
│                                                                             │
│   MVP (4-6 weeks)          V1.0 (2-3 weeks)        V1.x (ongoing)          │
│   ─────────────────        ────────────────        ───────────────          │
│                                                                             │
│   Core workflow            Polish & Pro            Growth features          │
│   • Import file            • Templates             • Multi-language         │
│   • Configure              • PDF export            • Advanced algo          │
│   • Optimize               • Better UX             • Integrations           │
│   • Export                 • All error states      • Teams version          │
│   • Basic licensing        • Auto-updates          • Analytics              │
│                                                                             │
│   Launch: Soft launch      Launch: Public          Launch: Continuous       │
│   Users: Early adopters    Users: General          Users: Expanding         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 0: Foundation (Week 1)

### Goal
Set up development environment and project structure.

### Deliverables

| Task | Details | Time |
|------|---------|------|
| Project scaffold | Electron + Vite + React + TypeScript | 2h |
| Tailwind + shadcn/ui | Install, configure, test | 2h |
| Zustand stores | Create data-store, license-store | 2h |
| IPC bridge | Set up preload script, typed API | 3h |
| i18n setup | i18next with English strings | 2h |
| Build config | electron-builder for all platforms | 3h |
| CI/CD | GitHub Actions for build/test | 2h |

### Exit Criteria
- [ ] `npm run dev` starts the app
- [ ] `npm run build` creates installers for Win/Mac/Linux
- [ ] Basic screen navigation works
- [ ] IPC communication works (main ↔ renderer)

---

## Phase 1: MVP Core (Weeks 2-5)

### Goal
Minimum viable product that delivers the core value proposition.

### MVP Definition

> **MVP = A user can import a file, optimize it, and export the result.**

### MVP Feature List

| Feature | In MVP | Notes |
|---------|--------|-------|
| Welcome screen | ✅ | Drop zone + sample data |
| File import (xlsx, csv) | ✅ | SheetJS parsing |
| Data preview | ✅ | Show first 10 rows |
| Column mapping | ✅ | Select Order ID + attributes |
| Changeover config | ✅ | Set times per attribute |
| Optimization | ✅ | Full algorithm (TD-02) |
| Results display | ✅ | Before/after, savings |
| Excel export | ✅ | Optimized sequence |
| CSV export | ✅ | Simple alternative |
| Clipboard copy | ✅ | Quick paste to Excel |
| Settings screen | ✅ | Language, theme (basic) |
| Free tier limits | ✅ | 50 orders, 3 attributes |
| License activation | ✅ | Paddle integration |
| Pro unlocked | ✅ | Remove limits |
| **PDF export** | ❌ | V1.0 |
| **Templates** | ❌ | V1.0 |
| **Auto-update** | ❌ | V1.0 |
| **Summary statistics** | ❌ | V1.0 |
| **Recent files** | ❌ | V1.0 |
| **Keyboard shortcuts** | ❌ | V1.0 |
| **Multi-language** | ❌ | V1.x |

### MVP Screens

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   MVP SCREEN FLOW (8 screens)                                               │
│   ─────────────────────────────────────────────────────────────────────────│
│                                                                             │
│   ┌──────────────┐                                                          │
│   │   WELCOME    │  ← Entry point                                          │
│   │  (Drop zone) │                                                          │
│   └──────┬───────┘                                                          │
│          │                                                                   │
│          ▼                                                                   │
│   ┌──────────────┐                                                          │
│   │ DATA PREVIEW │  ← Show what was imported                               │
│   │  (10 rows)   │                                                          │
│   └──────┬───────┘                                                          │
│          │                                                                   │
│          ▼                                                                   │
│   ┌──────────────┐                                                          │
│   │   COLUMN     │  ← Select Order ID column                               │
│   │   MAPPING    │  ← Select attribute columns                             │
│   └──────┬───────┘                                                          │
│          │                                                                   │
│          ▼                                                                   │
│   ┌──────────────┐                                                          │
│   │  CHANGEOVER  │  ← Set time per attribute                               │
│   │   CONFIG     │                                                          │
│   └──────┬───────┘                                                          │
│          │                                                                   │
│          ▼                                                                   │
│   ┌──────────────┐                                                          │
│   │  OPTIMIZING  │  ← Progress indicator                                   │
│   │  (loading)   │                                                          │
│   └──────┬───────┘                                                          │
│          │                                                                   │
│          ▼                                                                   │
│   ┌──────────────┐                                                          │
│   │   RESULTS    │  ← Before/After, savings                                │
│   │              │                                                          │
│   └──────┬───────┘                                                          │
│          │                                                                   │
│          ▼                                                                   │
│   ┌──────────────┐                                                          │
│   │   EXPORT     │  ← Excel, CSV, Clipboard                                │
│   │              │                                                          │
│   └──────────────┘                                                          │
│                                                                             │
│   Also: Settings (modal), Upgrade prompt (modal)                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### MVP Sprint Breakdown

#### Sprint 1 (Week 2): Import & Parse

| Task | Estimate | Details |
|------|----------|---------|
| Welcome screen UI | 4h | Dropzone, sample button, branding |
| File picker integration | 2h | Native dialog via IPC |
| Excel parsing | 4h | SheetJS integration |
| CSV parsing | 2h | SheetJS or native |
| Data preview screen | 4h | Table component, row limit |
| Error handling | 2h | Invalid file, empty file |
| **Total** | **18h** | |

**Demo:** User can drop/select a file and see preview.

#### Sprint 2 (Week 3): Configure

| Task | Estimate | Details |
|------|----------|---------|
| Column mapping screen | 6h | Dropdowns, validation |
| Auto-detect Order ID | 2h | Heuristic matching |
| Changeover config screen | 6h | Attribute list, time inputs |
| Add/remove attributes | 2h | Dynamic list |
| Validation | 2h | Required fields, limits |
| **Total** | **18h** | |

**Demo:** User can select columns and set changeover times.

#### Sprint 3 (Week 4): Optimize & Display

| Task | Estimate | Details |
|------|----------|---------|
| Optimization algorithm | 8h | Implement TD-02 |
| Optimizing screen | 2h | Progress indicator |
| Results screen | 8h | Stats, sequence table |
| Before/after comparison | 4h | Visual difference |
| **Total** | **22h** | |

**Demo:** User sees optimized results with savings.

#### Sprint 4 (Week 5): Export & Licensing

| Task | Estimate | Details |
|------|----------|---------|
| Excel export | 4h | SheetJS write |
| CSV export | 2h | Simple format |
| Clipboard copy | 2h | Tab-separated |
| Paddle integration | 6h | License activation |
| Free tier limits | 4h | Check and enforce |
| Upgrade prompts | 4h | Feature gates |
| Settings screen | 4h | Language, basic prefs |
| **Total** | **26h** | |

**Demo:** Complete workflow from import to export.

### MVP Total Effort

| Sprint | Hours | Focus |
|--------|-------|-------|
| Phase 0 | 16h | Foundation |
| Sprint 1 | 18h | Import |
| Sprint 2 | 18h | Configure |
| Sprint 3 | 22h | Optimize |
| Sprint 4 | 26h | Export & License |
| **Total** | **100h** | |

At 20h/week = **5 weeks**
At 30h/week = **3.5 weeks**
At 40h/week = **2.5 weeks**

---

## Phase 2: V1.0 Polish (Weeks 6-8)

### Goal
Production-ready release with all essential features.

### V1.0 Feature Additions

| Feature | Priority | Effort | Notes |
|---------|----------|--------|-------|
| PDF export | High | 8h | pdfmake, branded output |
| Templates (save/load) | High | 12h | Pro feature |
| Auto-update | High | 6h | electron-updater |
| Summary statistics | Medium | 4h | Per-attribute breakdown |
| Recent files | Medium | 4h | Quick access |
| Keyboard shortcuts | Medium | 4h | Ctrl+O, Ctrl+S, etc. |
| All error states | High | 8h | From UX-09 |
| Empty states | Medium | 4h | Better UX |
| Loading states | Medium | 2h | Consistent feedback |
| Help tooltips | Low | 4h | Contextual help |
| About dialog | Low | 2h | Version, links |
| **Total** | | **62h** | |

### V1.0 Quality Bar

| Area | Requirement |
|------|-------------|
| **Stability** | No crashes in normal use |
| **Performance** | Meets targets from UX-11 |
| **UX** | All screens polished per UX-04 |
| **Errors** | All error states handled per UX-09 |
| **Accessibility** | Keyboard navigation works |
| **Platforms** | Tested on Win 10/11, macOS 12+, Ubuntu 22 |

### V1.0 Launch Checklist

- [ ] All MVP features working
- [ ] All V1.0 features working
- [ ] Tested on all platforms
- [ ] Code signed (Windows, macOS)
- [ ] macOS notarized
- [ ] Auto-update working
- [ ] License activation working
- [ ] Website ready
- [ ] Documentation ready
- [ ] Pricing page live
- [ ] Support email configured

---

## Phase 3: V1.x Growth (Ongoing)

### V1.1: Internationalization (Week 9-10)

| Feature | Effort | Notes |
|---------|--------|-------|
| German (de) | 4h | Primary EU market |
| Finnish (fi) | 4h | Home market |
| Swedish (sv) | 2h | Nordic market |
| French (fr) | 4h | EU market |
| Spanish (es) | 4h | Large market |
| Language selector | 2h | Settings UI |
| **Total** | **20h** | 5 languages |

Remaining 7 languages in V1.2.

### V1.2: UX Improvements (Week 11-12)

| Feature | Effort | Notes |
|---------|--------|-------|
| Drag-and-drop columns | 6h | Reorder attributes |
| Undo/redo | 8h | Configuration changes |
| Dark mode | 4h | Theme support |
| Better charts | 6h | Recharts visualizations |
| Export presets | 4h | Save export settings |
| **Total** | **28h** | |

### V1.3: Advanced Features (Week 13-14)

| Feature | Effort | Notes |
|---------|--------|-------|
| Multiple sheets | 6h | Sheet selector |
| Column aliases | 4h | Map different names |
| Batch processing | 8h | Multiple files |
| Custom changeover matrix | 12h | Value-to-value times |
| **Total** | **30h** | |

### V1.4: Remaining Languages (Week 15)

| Feature | Effort | Notes |
|---------|--------|-------|
| Portuguese (pt) | 4h | |
| Italian (it) | 4h | |
| Dutch (nl) | 4h | |
| Polish (pl) | 4h | |
| Japanese (ja) | 4h | |
| Chinese (zh-CN) | 4h | |
| RTL preparation | 4h | Future Arabic/Hebrew |
| **Total** | **28h** | 6 languages + RTL prep |

---

## Phase 4: V2.0 Vision (Future)

### V2.0: Teams Integration

| Feature | Effort | Notes |
|---------|--------|-------|
| Teams SDK integration | 40h | App manifest, auth |
| SharePoint file picker | 16h | Replace native dialog |
| OneDrive save | 8h | Save to cloud |
| Teams tab app | 16h | Embedded experience |
| Teams subscription | 16h | Replace Paddle for Teams |
| **Total** | **96h** | Major release |

### V2.x: Advanced Optimization

| Feature | Effort | Notes |
|---------|--------|-------|
| Constraint support | 24h | Order dependencies |
| Multiple lines | 32h | Split across lines |
| Shift boundaries | 16h | Don't split across shifts |
| ML-based learning | 40h | Learn from history |
| **Total** | **112h** | Enterprise features |

### V3.0: Platform

| Feature | Notes |
|---------|-------|
| Web version | Full SaaS |
| API access | Programmatic optimization |
| Integrations | ERP connectors |
| Multi-tenant | Enterprise deployment |

---

## Feature Priority Matrix

### MoSCoW for MVP

| Must Have | Should Have | Could Have | Won't Have |
|-----------|-------------|------------|------------|
| File import | Auto-detect columns | Multiple sheets | Batch processing |
| Data preview | Error messages | Column aliases | Web version |
| Column mapping | Settings | Dark mode | API access |
| Changeover config | Free tier limits | Charts | Constraints |
| Optimization | License activation | | ML |
| Results display | | | |
| Excel export | | | |
| CSV export | | | |

### MoSCoW for V1.0

| Must Have | Should Have | Could Have | Won't Have |
|-----------|-------------|------------|------------|
| All MVP features | Summary stats | Help tooltips | Multi-language |
| PDF export | Recent files | Better charts | Teams |
| Templates | Keyboard shortcuts | Onboarding tour | |
| Auto-update | All error states | | |
| | Empty states | | |

---

## Risk Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Algorithm too slow | Low | High | Web Worker, progress UI |
| Paddle integration issues | Medium | High | Test early, have fallback |
| Cross-platform bugs | Medium | Medium | CI testing on all platforms |
| Large file handling | Medium | Medium | Streaming, limits, warnings |

### Schedule Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Scope creep | High | High | Strict MVP definition |
| Underestimated tasks | Medium | Medium | 20% buffer in estimates |
| External dependencies | Low | Medium | Minimize dependencies |

### Market Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| No early adopters | Medium | High | Pre-launch outreach |
| Wrong pricing | Medium | Medium | A/B test, easy to change |
| Competition launches | Low | Medium | Focus on niche, move fast |

---

## Success Metrics by Phase

### MVP Success

| Metric | Target |
|--------|--------|
| Working product | Ships on time |
| Core flow | Works without bugs |
| 10 beta users | Signed up and testing |
| Feedback collected | 5+ detailed responses |

### V1.0 Success

| Metric | Target |
|--------|--------|
| Public launch | Announced, available |
| First 100 downloads | Within 30 days |
| First 5 paying customers | Within 60 days |
| NPS from beta | > 40 |
| Critical bugs | 0 |

### V1.x Success

| Metric | Target |
|--------|--------|
| Monthly downloads | Growing 20%+ |
| Paying customers | 50+ by month 6 |
| Support tickets | < 5/week |
| Feature requests | Prioritized backlog |

---

## Development Workflow

### Git Branching

```
main                    # Production releases
├── develop             # Integration branch
│   ├── feature/import  # Feature branches
│   ├── feature/export
│   └── feature/license
└── release/v1.0        # Release candidates
```

### Release Process

```
1. Feature complete on develop
2. Create release/vX.Y branch
3. QA testing
4. Bug fixes to release branch
5. Merge to main
6. Tag release (vX.Y.Z)
7. CI builds and publishes
8. Auto-update available
```

### Version Numbering

```
v1.0.0
│ │ │
│ │ └── Patch: Bug fixes
│ └──── Minor: New features (backwards compatible)
└────── Major: Breaking changes
```

---

## Team Allocation (Solo Developer)

### Weekly Schedule

| Day | Focus |
|-----|-------|
| Monday | Feature development |
| Tuesday | Feature development |
| Wednesday | Feature development |
| Thursday | Testing, bug fixes |
| Friday | Documentation, planning |

### Time Split

| Activity | Percentage |
|----------|------------|
| Coding | 60% |
| Testing | 20% |
| Design/planning | 10% |
| Documentation | 5% |
| Marketing/outreach | 5% |

---

## Summary: What's In Each Phase

### MVP (Weeks 1-5)
```
✅ Welcome screen with drop zone
✅ Sample data ("Try it now")
✅ Excel/CSV import
✅ Data preview (10 rows)
✅ Column mapping (Order ID + attributes)
✅ Changeover time configuration
✅ Optimization (full algorithm)
✅ Results (before/after, savings %)
✅ Excel export
✅ CSV export
✅ Clipboard copy
✅ Basic settings (language, theme)
✅ Free tier limits (50 orders, 3 attributes)
✅ License activation (Paddle)
✅ Pro tier unlocks limits
```

### V1.0 (Weeks 6-8)
```
+ PDF export (Pro)
+ Templates (save/load config) (Pro)
+ Auto-update
+ Summary statistics (Pro)
+ Recent files
+ Keyboard shortcuts
+ All error states
+ Empty states
+ Loading states
+ Help tooltips
+ About dialog
```

### V1.x (Ongoing)
```
+ 12 languages
+ Dark mode
+ Better charts
+ Drag-and-drop columns
+ Undo/redo
+ Multiple sheets
+ Column aliases
+ Export presets
+ Batch processing
```

### V2.0 (Future)
```
+ Teams App Store
+ SharePoint/OneDrive integration
+ Advanced optimization (constraints)
+ Multiple production lines
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2024-12-20 | Initial development phases |
| | | |

---

*This roadmap is a guide, not a contract. Adapt based on user feedback and market reality.*
