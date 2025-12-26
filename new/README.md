# ChangeOverOptimizer Documentation

## Overview

ChangeOverOptimizer is a desktop application that helps manufacturers reduce changeover time through intelligent sequencing and SMED methodology.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────────────────────┐     ┌──────────────────────────────┐     │
│  │   SEQUENCE OPTIMIZATION      │     │      SMED MODULE             │     │
│  │                              │     │                              │     │
│  │   Reduce total changeover    │     │   Reduce each changeover    │     │
│  │   time by 30-50%             │     │   by 50-80%                 │     │
│  └──────────────────────────────┘     └──────────────────────────────┘     │
│                                                                             │
│  Pricing: €19/month or €149/year                                           │
│  Course:  €99 (Changeover Optimization Practitioner)                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

1. **Launch Plan**: `01-strategy/LAUNCH-PLAN.md` - Timeline, pricing, marketing
2. **Tech Setup**: `03-technical/ELECTRON-SETUP.md` - Project initialization
3. **Build SMED**: `03-technical/SMED-MODULE-SPEC.md` - Feature specification
4. **Website**: `05-website/HOMEPAGE-COPY.md` - Ready-to-use copy

---

## Document Index

### 01-strategy/
| Document | Description |
|----------|-------------|
| `LAUNCH-PLAN.md` | Go-to-market plan, timeline, revenue projections |

### 03-technical/
| Document | Description |
|----------|-------------|
| `TECH-STACK.md` | Electron + React + SQLite architecture |
| `SMED-MODULE-SPEC.md` | SMED features and UI mockups |
| `DATABASE-SCHEMA.md` | Complete Drizzle ORM schema |
| `ELECTRON-SETUP.md` | Step-by-step project setup |

### 04-course/
| Document | Description |
|----------|-------------|
| `COURSE-OVERVIEW.md` | €99 practitioner program overview |
| `CURRICULUM.md` | Detailed lesson plans and scripts |
| `templates/assessment-worksheet.md` | Changeover assessment template |
| `templates/implementation-checklist.md` | Project implementation guide |
| `templates/roi-calculator.md` | Business case calculator |

### 05-website/
| Document | Description |
|----------|-------------|
| `HOMEPAGE-COPY.md` | Full homepage content |
| `PRICING-PAGE.md` | Pricing page with FAQ |
| `COURSE-LANDING.md` | Course sales page |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Electron 33.x |
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | SQLite (better-sqlite3) + Drizzle ORM |
| Build | Electron Forge + Vite |
| Testing | Playwright + Vitest |
| Payments | Paddle |

---

## Package Contents

```
changeoveroptimizer/
├── README.md
├── 01-strategy/
│   └── LAUNCH-PLAN.md              ✅
├── 02-product/
│   └── (future)
├── 03-technical/
│   ├── TECH-STACK.md               ✅
│   ├── SMED-MODULE-SPEC.md         ✅
│   ├── DATABASE-SCHEMA.md          ✅
│   └── ELECTRON-SETUP.md           ✅
├── 04-course/
│   ├── COURSE-OVERVIEW.md          ✅
│   ├── CURRICULUM.md               ✅
│   └── templates/
│       ├── assessment-worksheet.md  ✅
│       ├── implementation-checklist.md ✅
│       └── roi-calculator.md        ✅
├── 05-website/
│   ├── HOMEPAGE-COPY.md            ✅
│   ├── PRICING-PAGE.md             ✅
│   └── COURSE-LANDING.md           ✅
└── 06-operations/
    └── (future)
```

**Total: 13 documents, ~200 KB**

---

## Year 1 Targets

| Metric | Target |
|--------|--------|
| Software customers | 420 |
| Course enrollments | 240 |
| MRR (Month 12) | €19,000 |
| Total revenue | ~€258,000 |

---

*Documentation Package v1.0 | December 2024*
