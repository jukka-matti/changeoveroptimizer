# Architecture Analysis & Refactoring Plan

**Date:** December 26, 2024
**Scope:** IPC Layer, State Management, Type Safety, Component Reuse

## 1. Architectural Overview

The current architecture follows a clean **Main Process (Electron) <-> Renderer (React)** separation.

*   **Frontend (Renderer)**: React + Zustand + Tailwind. Handles presentation and optimizing logic (client-side for performance).
*   **Backend (Main)**: Electron + Better-SQLite3. Handles filesystem access, heavy I/O, and persistent data (SMED studies, Changeover Matrix).
*   **Communication**: IPC bridges (`ipcRenderer.invoke` <-> `ipcMain.handle`).

This is a solid "Local-First" architecture suitable for a desktop app.

## 2. Refactoring Opportunities

### 2.1 Decouple `ipc-handlers.ts`
**Severity**: 🟡 Medium (Technical Debt)
**Problem**: `src-electron/ipc-handlers.ts` is becoming a "God File" (575 lines). It directly imports DB queries and handles IPC wrapping. As more features (SMED, Analytics) are added, this file will become unmanageable.
**Proposal**: Split handlers by domain.
*   Create `src-electron/handlers/smed-handlers.ts`
*   Create `src-electron/handlers/analytics-handlers.ts`
*   Create `src-electron/handlers/matrix-handlers.ts`
*   Register them in `main.ts` or a central `registerHandlers()` function.

### 2.2 Unify Type Definitions
**Severity**: 🟡 Medium (Maintainability)
**Problem**: We have `src/types/index.ts` (Frontend types) and potentially separate Drizzle schema types in `src-electron/db/schema`.
**Risk**: Protocol drift. If the DB schema changes, the frontend types might not update, causing runtime errors at the IPC boundary.
**Proposal**:
*   Create a shared `packages/types` or `src/shared-types.ts` (if monorepo is overkill).
*   Export Drizzle inferred types (`type ChangeoverAttribute = typeof changeoverAttributes.$inferSelect`) and use them directly in the frontend types.

### 2.3 Refine `optimizer.ts` Interface
**Severity**: 🟢 Low (Polish)
**Problem**: The `optimize` function takes raw `Order[]` and `AttributeConfig[]`.
**Proposal**: Refactor to accept a simplified `OptimizationRequest` object. This makes it easier to pass data to a **Web Worker** in the future (Phase 3 risk mitigation) without changing the function signature.

### 2.4 Component Reusability
**Severity**: 🟢 Low (Polish)
**Observation**: `WelcomeScreen` and `DataPreviewScreen` both use direct layout classes.
**Proposal**: Extract a `<ScreenLayout>` component that handles the standard padding (`max-w-container-normal mx-auto py-8 px-6`) and header block. This ensures all screens have identical margins and responsive behavior.

## 3. Recommended Roadmap

| Refactor | Effort | Value | Description |
| :--- | :--- | :--- | :--- |
| **Split IPC Handlers** | 2h | High | Prevents `ipc-handlers.ts` from growing to 2000+ lines. |
| **Shared Types** | 1h | High | Enforces type safety across the IPC bridge. |
| **ScreenLayout Component** | 1h | Med | Ensures visual consistency across 12+ screens. |

## 4. Conclusion

The architecture is healthy. It does not need a "rewrite". It needs **scaling patterns** applied now, before the "Polish" phase adds more complexity.
