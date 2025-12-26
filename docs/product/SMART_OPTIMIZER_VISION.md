# Smart Optimizer Vision: The "Intelligent Assistant"

**Philosophy**: The system is **Process-First**, not Data-First. It assumes the user has a standardized way of working (or wants one) and helps enforce that standard onto new data, rather than passively accepting whatever data format is uploaded.

---

## 1. The "Virtuous Cycle" Architecture

The platform connects **Analysis (SMED)** with **Automation (Optimizer)** in a continuous feedback loop.

1.  **Signal (Optimizer)**: Run an optimization -> Identify that "Color Change" is the biggest bottleneck (costing 10 hours/week).
2.  **Action (SMED)**: Create a SMED Study for "Color Change". Analyze video, identify waste, and create a new **Standard**.
    *   *Result*: Reduce changeover from 30m -> 15m.
3.  **Live Link (Automation)**: When you **Publish** the new Standard in the SMED module, the system asks:
    *   *"Update Optimizer Rules with new 15m time?"*
    *   If **Yes**, the `ChangeoverMatrix` is automatically updated.
4.  **Result**: Next optimization run uses the improved time, showing immediate ROI.

---

## 2. Standard-First Mapping (The Entry)

**Problem**: Traditional tools ask *"What is this column?"* for every file, forcing the user to rebuild their logic repeatedly.
**Solution**: We present the **User's Standards** first.

### UI Concept
When importing a file, the screen is divided into two sections:

#### A. "Map to Your Standards" (Primary)
The system lists your known, optimized attributes from the database.
*   **"Color Change" (15m)**: [ Dropdown: Map to `Product_Color` ]
*   **"Size Change" (10m)**: [ Dropdown: Map to `Dimensions` ]

**Benefit**: Even if the file headers change (`Col_A`, `Prod_Var`), the process remains constant. You map the file to the *Process*.

#### B. "New Attributes" (Secondary)
Lists any unmapped columns from the file.
*   **Action**: "Create new Standard from `Material`?"

---

## 3. Intelligent Defaults (The Assistant)

### "Implicit Memory"
The system learns from every valid optimization run.
*   **Auto-Learn**: If you override a time (e.g., set "Color" to 20m) and run the optimizer, the system updates the global default for "Color" to 20m.
*   **Auto-Recall**: The next time you map a column to "Color", it pre-fills 20m.

### "Zero-Config" Experience
For recurring files with consistent headers, the system:
1.  **Auto-Detects** headers matches (e.g., `Color` matches known standard "Color").
2.  **Auto-Maps** them.
3.  **Auto-Applies** the latest times.

**Result**: A user can go from **Import -> Optimize** in 2 clicks, trusting the system has applied their latest standards.

---

*Version 2.0 | December 2025*
