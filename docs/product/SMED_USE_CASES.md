# SMED Module - Main Use Cases

**Target User**: Continuous Improvement Manager / Lean Engineer / Machine Operator

This document outlines the systematic use cases for the SMED (Single-Minute Exchange of Die) module. These use cases serve as the foundation for acceptance testing, automated test scenarios, and user documentation.

---

## Use Case 1: Create Baseline Changeover Study

**Actor**: CI Manager
**Goal**: Document the current state of a specific changeover to establish a baseline.

**Preconditions**:
- User has recorded a video of a changeover (e.g., Product A -> Product B).
- User knows the products/attributes involved (e.g., "Change Color: Red to Blue").

**Main Flow**:
1.  User navigates to **SMED Module > Studies**.
2.  User clicks **"New Study"**.
3.  User enters details:
    -   **Name**: "Line 1: Red to Blue"
    -   **Description**: "Baseline analysis of color change."
    -   **Machine**: "Extruder 1"
4.  User saves the Study (Status: `DRAFT`).
5.  User enters **Step Analysis Mode**.
6.  User adds **Steps** sequentially (simulating watching the video):
    -   Step 1: "Stop machine" (Duration: 0:30, Type: `Internal`, Category: `Preparation`)
    -   Step 2: "Clean hopper" (Duration: 15:00, Type: `Internal`, Category: `Cleanup`)
    -   Step 3: "Load new material" (Duration: 5:00, Type: `Internal`, Category: `Preparation`)
7.  System calculates **Total Baseline Time** (20:30).
8.  User sets study status to `ANALYZING`.

**Success Criteria**:
-   Study exists in database.
-   Steps are saved with correct durations and types.
-   Baseline time is calculated correctly.

---

## Use Case 2: Analyze and Identify Improvements

**Actor**: CI Manager
**Goal**: Reduce the internal changeover time by identifying ECRS (Eliminate, Combine, Reduce, Simplify) opportunities.

**Preconditions**:
-   Use Case 1 completed (Study in `ANALYZING`).

**Main Flow**:
1.  User opens the `ANALYZING` study.
2.  User reviews the "Clean hopper" step (15:00, Internal).
3.  User identifies that "Load new material" can be done *before* stopping the machine if a secondary hopper is used.
4.  User clicks **"Add Improvement"**:
    -   **Type**: `Convert to External`
    -   **Description**: "Pre-stage new material in secondary hopper."
    -   **Estimated Savings**: 5:00.
    -   **Linked Step**: "Load new material".
5.  User identifies "Clean hopper" takes too long. Adds Improvement:
    -   **Type**: `Streamline Internal`
    -   **Description**: "Use high-pressure air gun."
    -   **Estimated Savings**: 5:00.
6.  System displays **Projected Target Time** (10:30).
7.  User moves study status to `IMPROVING`.

**Success Criteria**:
-   Improvements are linked to the study.
-   Target time is updated based on estimated savings.

---

## Use Case 3: Create and Publish Standard Work

**Actor**: CI Manager
**Goal**: Formalize the improved process into a Standard Operating Procedure (SOP).

**Preconditions**:
-   Improvements have been implemented.
-   Study status is `IMPROVING`.

**Main Flow**:
1.  User navigates to **Standard Work** tab of the study.
2.  User clicks **"Generate Standard"**.
3.  System copies current steps (incorporating improvements).
4.  User edits the step sequence:
    -   Moves "Load new material" to start (External).
    -   Updates "Clean hopper" duration to 10:00 (verified improvement).
5.  User adds **Tools Required**: "High-pressure air gun", "Secondary Hopper".
6.  User sets **Standard Time**: 10:30.
7.  User pushes **"Publish v1.0"**.
8.  System locks the Standard and sets Study status to `STANDARDIZED`.

**Success Criteria**:
-   `smed_standards` record created.
-   Standard is marked `Active`.
-   Integration: Standard time (10:30) is pushed to the main **Changeover Matrix** for "Red -> Blue".

---

## Use Case 4: Execute Changeover (Timer)

**Actor**: Machine Operator
**Goal**: Perform a changeover following the standard work and record actual performance.

**Preconditions**:
-   Active Standard exists for "Red -> Blue".
-   Tablet/PC available at line.

**Main Flow**:
1.  Operator selects **SMED Module > Timer**.
2.  Operator selects "Line 1: Red to Blue".
3.  App displays **Standard Work v1.0** checklist.
4.  Operator clicks **"Start Changeover"**. Timer starts.
5.  Operator performs External steps (timer running or separate "External" timer).
6.  Operator stops machine -> Clicks **"Start Internal"**.
7.  Operator checks off steps as they complete ("Clean hopper" - Done).
8.  Operator encounters delay: Adds **Note**: "Air gun jammed".
9.  Operator finishes. Clicks **"Complete"**.
10. System saves **Changeover Log**.

**Success Criteria**:
-   `smed_changeover_logs` record created.
-   Actual time, operator name, and notes are saved.
-   Variance from standard (Actual - Standard) is calculated.

---

## Use Case 5: Track Performance (Analytics)

**Actor**: Production Manager
**Goal**: Monitor adherence to standards and continuous improvement trends.

**Preconditions**:
-   Multiple Changeover Logs exist.

**Main Flow**:
1.  User navigates to **SMED Module > Analytics**.
2.  User selects **"Trend Viewer"**.
3.  System displays graph of "Red -> Blue" changeover times over last 30 days.
4.  User sees a spike on "Oct 12".
5.  User clicks the data point to view the **Changeover Log**.
6.  User sees Note: "Air gun jammed".
7.  User identifies need for "Air Gun Maintenance" standard.

**Success Criteria**:
-   Analytics correctly aggregate Log data.
-   Drill-down to specific Log works.

---
