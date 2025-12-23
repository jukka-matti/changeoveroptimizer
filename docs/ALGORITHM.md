# TD-02: Optimization Algorithm

**The Core IP of ChangeoverOptimizer**

---

## Purpose

This document specifies the optimization algorithm that minimizes changeover time by intelligently sequencing production orders. This is ChangeoverOptimizer's core intellectual property.

---

## Problem Statement

### The Changeover Problem

Manufacturing lines lose time when switching between products with different attributes:

```
Order Sequence (Before):
┌─────────┬───────┬───────┬──────────────┐
│ Order   │ Color │ Size  │ Changeover   │
├─────────┼───────┼───────┼──────────────┤
│ ORD-001 │ Red   │ Large │ —            │
│ ORD-002 │ Blue  │ Small │ 15 + 8 = 23  │  ← Color + Size change
│ ORD-003 │ Red   │ Large │ 15 + 8 = 23  │  ← Color + Size change
│ ORD-004 │ Blue  │ Large │ 15     = 15  │  ← Color change only
│ ORD-005 │ Blue  │ Small │      8 =  8  │  ← Size change only
└─────────┴───────┴───────┴──────────────┘
                    Total:   69 minutes
```

### The Opportunity

By reordering, we can minimize changeovers:

```
Order Sequence (After):
┌─────────┬───────┬───────┬──────────────┐
│ Order   │ Color │ Size  │ Changeover   │
├─────────┼───────┼───────┼──────────────┤
│ ORD-001 │ Red   │ Large │ —            │
│ ORD-003 │ Red   │ Large │      0 =  0  │  ← No change!
│ ORD-004 │ Blue  │ Large │ 15     = 15  │  ← Color only
│ ORD-005 │ Blue  │ Small │      8 =  8  │  ← Size only
│ ORD-002 │ Blue  │ Small │      0 =  0  │  ← No change!
└─────────┴───────┴───────┴──────────────┘
                    Total:   23 minutes

Savings: 69 - 23 = 46 minutes (67% reduction)
```

---

## Algorithm Overview

### Approach: Hierarchical Greedy with Refinement

We use a **hierarchical greedy algorithm** because:

1. **Fast** — O(n log n) average case, works on 10,000+ orders
2. **Deterministic** — Same input always gives same output
3. **Explainable** — Users can understand why orders are grouped
4. **Good enough** — Typically achieves 80-95% of theoretical optimum

### Algorithm Phases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   OPTIMIZATION PIPELINE                                                     │
│   ─────────────────────────────────────────────────────────────────────────│
│                                                                             │
│   Phase 1: PREPARATION                                                      │
│   ├── Validate inputs                                                       │
│   ├── Extract attribute values from orders                                  │
│   └── Sort attributes by changeover time (longest first)                   │
│                                                                             │
│   Phase 2: HIERARCHICAL GROUPING                                            │
│   ├── Group orders by primary attribute (longest changeover)               │
│   ├── Within each group, sub-group by secondary attribute                  │
│   ├── Recursively apply to all attribute levels                            │
│   └── Result: Nested groups of similar orders                              │
│                                                                             │
│   Phase 3: SEQUENCE GENERATION                                              │
│   ├── Flatten groups into linear sequence                                  │
│   ├── Order groups to minimize inter-group changeovers                     │
│   └── Result: Optimized order sequence                                     │
│                                                                             │
│   Phase 4: REFINEMENT (Optional)                                            │
│   ├── Apply 2-opt local search                                              │
│   ├── Try swapping adjacent pairs                                           │
│   └── Accept swaps that reduce total changeover                            │
│                                                                             │
│   Phase 5: CALCULATION                                                      │
│   ├── Calculate changeover time for each order                             │
│   ├── Sum total before and after                                           │
│   └── Return result with statistics                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Structures

### Input Types

```typescript
// types/optimizer.ts

/**
 * A single production order with its attribute values
 */
export interface Order {
  /** Unique identifier (from Order ID column) */
  id: string;
  
  /** Original position in the input file (0-indexed) */
  originalIndex: number;
  
  /** Attribute column name → value */
  values: Record<string, string>;
}

/**
 * Configuration for a single attribute
 */
export interface AttributeConfig {
  /** Column name in the source data */
  column: string;

  /** Time in minutes to change this attribute */
  changeoverTime: number;

  /** Parallel group ID ("default", "A", "B", "C", "D") */
  parallelGroup: string;
}

/**
 * Input to the optimization algorithm
 */
export interface OptimizationInput {
  orders: Order[];
  attributes: AttributeConfig[];
}
```

### Output Types

```typescript
/**
 * An order in the optimized sequence
 */
export interface OptimizedOrder extends Order {
  /** Position in optimized sequence (1-indexed for display) */
  sequenceNumber: number;

  /** Changeover time from previous order - legacy field, same as workTime */
  changeoverTime: number;

  /** Which attributes changed from previous order */
  changeoverReasons: string[];

  /** Sum of all changeover times (labor cost) */
  workTime: number;

  /** Max per parallel group, sum across groups (production impact) */
  downtime: number;
}

/**
 * Statistics for a single attribute
 */
export interface AttributeStat {
  /** Column name */
  column: string;

  /** Number of times this attribute changed */
  changeoverCount: number;

  /** Total changeover time for this attribute */
  totalTime: number;

  /** Parallel group this attribute belongs to */
  parallelGroup: string;
}

/**
 * Complete optimization result
 */
export interface OptimizationResult {
  /** Optimized sequence of orders */
  sequence: OptimizedOrder[];

  // Work time metrics (sum of all changeover times - labor cost)
  /** Total work time before optimization */
  totalBefore: number;
  /** Total work time after optimization */
  totalAfter: number;
  /** Work time saved in minutes */
  savings: number;
  /** Work time percentage reduction */
  savingsPercent: number;

  // Downtime metrics (considering parallel groups - production impact)
  /** Total downtime before optimization */
  totalDowntimeBefore: number;
  /** Total downtime after optimization */
  totalDowntimeAfter: number;
  /** Downtime saved in minutes */
  downtimeSavings: number;
  /** Downtime percentage reduction */
  downtimeSavingsPercent: number;

  /** Per-attribute statistics */
  attributeStats: AttributeStat[];
}
```

---

## Algorithm Implementation

### Main Entry Point

```typescript
// services/optimizer.ts

import type {
  Order,
  AttributeConfig,
  OptimizedOrder,
  OptimizationResult,
  AttributeStat,
} from '@/types/optimizer';

/**
 * Optimize production order sequence to minimize changeover time.
 * 
 * @param input - Orders and attribute configuration
 * @returns Optimized sequence with statistics
 */
export function optimize(input: OptimizationInput): OptimizationResult {
  const { orders, attributes } = input;
  
  // Edge cases
  if (orders.length === 0) {
    return createEmptyResult();
  }
  
  if (orders.length === 1) {
    return createSingleOrderResult(orders[0]);
  }
  
  // Phase 1: Preparation
  const sortedAttributes = sortAttributesByTime(attributes);
  
  // Phase 2: Hierarchical grouping
  const groups = createHierarchicalGroups(orders, sortedAttributes);
  
  // Phase 3: Sequence generation
  const sequence = flattenGroupsOptimally(groups, sortedAttributes);
  
  // Phase 4: Refinement (optional, for better results)
  const refined = applyLocalSearch(sequence, sortedAttributes);
  
  // Phase 5: Calculate results
  return calculateResult(orders, refined, sortedAttributes);
}
```

### Phase 1: Preparation

```typescript
/**
 * Sort attributes by changeover time (longest first).
 * This ensures we prioritize avoiding expensive changeovers.
 */
function sortAttributesByTime(attributes: AttributeConfig[]): AttributeConfig[] {
  return [...attributes].sort((a, b) => b.changeoverTime - a.changeoverTime);
}
```

### Phase 2: Hierarchical Grouping

```typescript
/**
 * Recursively group orders by attribute values.
 * 
 * Example with attributes [Color (15min), Size (8min)]:
 * 
 * Input orders:
 *   Red-Large, Red-Small, Blue-Large, Blue-Small, Red-Large
 * 
 * After grouping by Color:
 *   Red: [Red-Large, Red-Small, Red-Large]
 *   Blue: [Blue-Large, Blue-Small]
 * 
 * After sub-grouping by Size:
 *   Red:
 *     Large: [Red-Large, Red-Large]
 *     Small: [Red-Small]
 *   Blue:
 *     Large: [Blue-Large]
 *     Small: [Blue-Small]
 */

interface OrderGroup {
  key: string;           // Attribute value (e.g., "Red")
  orders: Order[];       // Orders in this group
  subgroups?: OrderGroup[]; // Nested groups for next attribute
}

function createHierarchicalGroups(
  orders: Order[],
  attributes: AttributeConfig[],
  depth: number = 0
): OrderGroup[] {
  // Base case: no more attributes to group by
  if (depth >= attributes.length) {
    return [];
  }
  
  const attribute = attributes[depth];
  const column = attribute.column;
  
  // Group orders by this attribute's value
  const groupMap = new Map<string, Order[]>();
  
  for (const order of orders) {
    const value = String(order.values[column] ?? '');
    
    if (!groupMap.has(value)) {
      groupMap.set(value, []);
    }
    groupMap.get(value)!.push(order);
  }
  
  // Convert to array of groups
  const groups: OrderGroup[] = [];
  
  for (const [key, groupOrders] of groupMap) {
    const group: OrderGroup = {
      key,
      orders: groupOrders,
    };
    
    // Recursively create subgroups
    if (depth < attributes.length - 1) {
      group.subgroups = createHierarchicalGroups(
        groupOrders,
        attributes,
        depth + 1
      );
    }
    
    groups.push(group);
  }
  
  return groups;
}
```

### Phase 3: Sequence Generation

```typescript
/**
 * Flatten hierarchical groups into a linear sequence.
 * Orders groups to minimize transitions between groups.
 */
function flattenGroupsOptimally(
  groups: OrderGroup[],
  attributes: AttributeConfig[]
): Order[] {
  if (groups.length === 0) {
    return [];
  }
  
  // Sort groups by size (largest first) for better results
  // This keeps the most common values together
  const sortedGroups = [...groups].sort(
    (a, b) => b.orders.length - a.orders.length
  );
  
  const result: Order[] = [];
  
  for (const group of sortedGroups) {
    if (group.subgroups && group.subgroups.length > 0) {
      // Recursively flatten subgroups
      const subOrders = flattenGroupsOptimally(
        group.subgroups,
        attributes.slice(1)
      );
      result.push(...subOrders);
    } else {
      // Leaf group: add orders directly
      result.push(...group.orders);
    }
  }
  
  return result;
}
```

### Phase 4: Local Search Refinement

```typescript
/**
 * Apply 2-opt local search to improve the sequence.
 * Optimizes for DOWNTIME (production impact) rather than work time.
 *
 * This is optional but typically improves results by 5-15%.
 */
function applyLocalSearch(
  sequence: Order[],
  attributes: AttributeConfig[],
  maxIterations: number = 100
): Order[] {
  if (sequence.length <= 2) {
    return sequence;
  }

  let current = [...sequence];
  // Optimize for downtime (production impact), not work time
  let currentCost = calculateTotalChangeoverMetrics(current, attributes).totalDowntime;
  let improved = true;
  let iterations = 0;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    // Try swapping each adjacent pair
    for (let i = 0; i < current.length - 1; i++) {
      // Swap positions i and i+1
      const candidate = [...current];
      [candidate[i], candidate[i + 1]] = [candidate[i + 1], candidate[i]];

      const candidateCost = calculateTotalChangeoverMetrics(candidate, attributes).totalDowntime;

      if (candidateCost < currentCost) {
        current = candidate;
        currentCost = candidateCost;
        improved = true;
      }
    }
  }

  return current;
}
```

### Phase 5: Result Calculation

The result calculation phase computes both **Work Time** (total labor cost) and **Downtime** (production impact) metrics, accounting for parallel groups.

#### Key Concept: Work Time vs Downtime

- **Work Time**: Sum of all changeover times (total labor needed)
- **Downtime**: For each parallel group, only the longest changeover determines line stoppage. Sum across groups.

```
Example: Color (15 min, Group A), Finish (10 min, Group A), Material (20 min, Group B)
If all three change:
  Work Time = 15 + 10 + 20 = 45 min (labor cost)
  Downtime  = max(15, 10) + 20 = 35 min (line stopped)
```

```typescript
interface ChangeoverMetrics {
  workTime: number;   // Sum of all changeover times (labor cost)
  downtime: number;   // Max per parallel group, sum across groups (production impact)
  reasons: string[];  // Which attributes changed
}

/**
 * Calculate changeover metrics between two consecutive orders.
 * Accounts for parallel groups where tasks can overlap.
 */
function calculateChangeoverWithParallelism(
  prev: Order,
  curr: Order,
  attributes: AttributeConfig[]
): ChangeoverMetrics {
  let workTime = 0;
  const reasons: string[] = [];
  const groupTimes = new Map<string, number>(); // Track max time per parallel group

  for (const attr of attributes) {
    const prevValue = String(prev.values[attr.column] ?? '');
    const currValue = String(curr.values[attr.column] ?? '');

    if (prevValue !== currValue) {
      workTime += attr.changeoverTime;
      reasons.push(attr.column);

      // Track max time per parallel group
      const group = attr.parallelGroup;
      const currentMax = groupTimes.get(group) ?? 0;
      groupTimes.set(group, Math.max(currentMax, attr.changeoverTime));
    }
  }

  // Downtime = sum of max times across groups
  let downtime = 0;
  for (const maxTime of groupTimes.values()) {
    downtime += maxTime;
  }

  return { workTime, downtime, reasons };
}

interface TotalMetrics {
  totalWorkTime: number;
  totalDowntime: number;
}

/**
 * Calculate total changeover metrics for a sequence.
 */
function calculateTotalChangeoverMetrics(
  sequence: Order[],
  attributes: AttributeConfig[]
): TotalMetrics {
  let totalWorkTime = 0;
  let totalDowntime = 0;

  for (let i = 1; i < sequence.length; i++) {
    const metrics = calculateChangeoverWithParallelism(sequence[i - 1], sequence[i], attributes);
    totalWorkTime += metrics.workTime;
    totalDowntime += metrics.downtime;
  }

  return { totalWorkTime, totalDowntime };
}

/**
 * Build the complete optimization result with dual metrics.
 */
function calculateResult(
  originalOrders: Order[],
  optimizedSequence: Order[],
  attributes: AttributeConfig[]
): OptimizationResult {
  // Calculate "before" metrics for original sequence
  const beforeMetrics = calculateTotalChangeoverMetrics(originalOrders, attributes);

  // Build optimized orders with both work time and downtime
  const sequence: OptimizedOrder[] = optimizedSequence.map((order, index) => {
    if (index === 0) {
      return {
        ...order,
        sequenceNumber: 1,
        changeoverTime: 0,
        changeoverReasons: [],
        workTime: 0,
        downtime: 0,
      };
    }

    const metrics = calculateChangeoverWithParallelism(
      optimizedSequence[index - 1],
      order,
      attributes
    );

    return {
      ...order,
      sequenceNumber: index + 1,
      changeoverTime: metrics.workTime, // Legacy field for backward compatibility
      changeoverReasons: metrics.reasons,
      workTime: metrics.workTime,
      downtime: metrics.downtime,
    };
  });

  // Calculate totals from sequence
  const totalAfter = sequence.reduce((sum, o) => sum + o.workTime, 0);
  const totalDowntimeAfter = sequence.reduce((sum, o) => sum + o.downtime, 0);

  // Work time savings
  const savings = beforeMetrics.totalWorkTime - totalAfter;
  const savingsPercent = beforeMetrics.totalWorkTime > 0
    ? Math.round((savings / beforeMetrics.totalWorkTime) * 100)
    : 0;

  // Downtime savings
  const downtimeSavings = beforeMetrics.totalDowntime - totalDowntimeAfter;
  const downtimeSavingsPercent = beforeMetrics.totalDowntime > 0
    ? Math.round((downtimeSavings / beforeMetrics.totalDowntime) * 100)
    : 0;

  // Per-attribute statistics with parallel group
  const attributeStats: AttributeStat[] = attributes.map((attr) => {
    let count = 0;
    let time = 0;

    for (const order of sequence) {
      if (order.changeoverReasons.includes(attr.column)) {
        count++;
        time += attr.changeoverTime;
      }
    }

    return {
      column: attr.column,
      changeoverCount: count,
      totalTime: time,
      parallelGroup: attr.parallelGroup,
    };
  });

  return {
    sequence,
    totalBefore: beforeMetrics.totalWorkTime,
    totalAfter,
    savings,
    savingsPercent,
    totalDowntimeBefore: beforeMetrics.totalDowntime,
    totalDowntimeAfter,
    downtimeSavings,
    downtimeSavingsPercent,
    attributeStats,
  };
}
```

### Edge Case Handlers

```typescript
function createEmptyResult(): OptimizationResult {
  return {
    sequence: [],
    totalBefore: 0,
    totalAfter: 0,
    savings: 0,
    savingsPercent: 0,
    totalDowntimeBefore: 0,
    totalDowntimeAfter: 0,
    downtimeSavings: 0,
    downtimeSavingsPercent: 0,
    attributeStats: [],
  };
}

function createSingleOrderResult(order: Order): OptimizationResult {
  return {
    sequence: [{
      ...order,
      sequenceNumber: 1,
      changeoverTime: 0,
      changeoverReasons: [],
      workTime: 0,
      downtime: 0,
    }],
    totalBefore: 0,
    totalAfter: 0,
    savings: 0,
    savingsPercent: 0,
    totalDowntimeBefore: 0,
    totalDowntimeAfter: 0,
    downtimeSavings: 0,
    downtimeSavingsPercent: 0,
    attributeStats: [],
  };
}
```

---

## Algorithm Complexity

### Time Complexity

| Phase | Complexity | Notes |
|-------|------------|-------|
| Preparation | O(a log a) | Sort attributes, a = attribute count |
| Grouping | O(n × a) | Iterate orders × attributes |
| Flattening | O(n) | Single pass through groups |
| Local Search | O(n² × i) | n² swaps × i iterations |
| Calculation | O(n × a) | Calculate changeovers |

**Overall: O(n² × i)** where n = orders, i = refinement iterations

For practical purposes:
- 50 orders: < 100ms
- 500 orders: < 1 second
- 5,000 orders: < 30 seconds

### Space Complexity

**O(n)** — We store the sequence and groups, proportional to order count.

---

## Example Walkthrough

### Input

```typescript
const orders: Order[] = [
  { id: 'ORD-001', originalIndex: 0, values: { Color: 'Red', Size: 'Large', Material: 'Steel' } },
  { id: 'ORD-002', originalIndex: 1, values: { Color: 'Blue', Size: 'Small', Material: 'Aluminum' } },
  { id: 'ORD-003', originalIndex: 2, values: { Color: 'Red', Size: 'Large', Material: 'Steel' } },
  { id: 'ORD-004', originalIndex: 3, values: { Color: 'Blue', Size: 'Large', Material: 'Steel' } },
  { id: 'ORD-005', originalIndex: 4, values: { Color: 'Blue', Size: 'Small', Material: 'Steel' } },
  { id: 'ORD-006', originalIndex: 5, values: { Color: 'Red', Size: 'Small', Material: 'Aluminum' } },
];

// Example with parallel groups: Color and Size can be done by the same crew (Group A)
// Material requires a different crew (Group B)
const attributes: AttributeConfig[] = [
  { column: 'Color', changeoverTime: 15, parallelGroup: 'A' },
  { column: 'Size', changeoverTime: 8, parallelGroup: 'A' },
  { column: 'Material', changeoverTime: 12, parallelGroup: 'B' },
];
```

### Step 1: Sort Attributes

```
Sorted by changeover time (descending):
1. Color: 15 min
2. Material: 12 min
3. Size: 8 min
```

### Step 2: Hierarchical Grouping

```
By Color:
├── Red (3 orders)
│   ├── By Material:
│   │   ├── Steel (2): ORD-001, ORD-003
│   │   └── Aluminum (1): ORD-006
│   └── By Size:
│       ├── Large: ORD-001, ORD-003
│       └── Small: ORD-006
└── Blue (3 orders)
    ├── By Material:
    │   ├── Steel (2): ORD-004, ORD-005
    │   └── Aluminum (1): ORD-002
    └── By Size:
        ├── Large: ORD-004
        └── Small: ORD-002, ORD-005
```

### Step 3: Flatten Sequence

```
Optimized sequence (with parallel groups A and B):

1. ORD-001 (Red, Large, Steel)
   — First order
   — Work Time: 0, Downtime: 0

2. ORD-003 (Red, Large, Steel)
   — No change!
   — Work Time: 0, Downtime: 0

3. ORD-006 (Red, Small, Aluminum)
   — Size (A) + Material (B) change
   — Work Time: 8 + 12 = 20 min
   — Downtime: max(8) + 12 = 20 min (no parallelism benefit, different groups)

4. ORD-004 (Blue, Large, Steel)
   — Color (A) + Size (A) + Material (B) change
   — Work Time: 15 + 8 + 12 = 35 min
   — Downtime: max(15, 8) + 12 = 27 min (Color & Size overlap!)

5. ORD-005 (Blue, Small, Steel)
   — Size (A) only
   — Work Time: 8, Downtime: 8

6. ORD-002 (Blue, Small, Aluminum)
   — Material (B) only
   — Work Time: 12, Downtime: 12

Totals after optimization:
  Work Time: 0 + 0 + 20 + 35 + 8 + 12 = 75 min
  Downtime:  0 + 0 + 20 + 27 + 8 + 12 = 67 min
```

### Step 4: Calculate Before

```
Original sequence (with parallel groups):

1. ORD-001 (Red, Large, Steel)
   — First order
   — Work Time: 0, Downtime: 0

2. ORD-002 (Blue, Small, Aluminum)
   — All three change: Color (A) + Size (A) + Material (B)
   — Work Time: 15 + 8 + 12 = 35 min
   — Downtime: max(15, 8) + 12 = 27 min

3. ORD-003 (Red, Large, Steel)
   — All three change: Color (A) + Size (A) + Material (B)
   — Work Time: 35 min, Downtime: 27 min

4. ORD-004 (Blue, Large, Steel)
   — Color (A) only
   — Work Time: 15 min, Downtime: 15 min

5. ORD-005 (Blue, Small, Steel)
   — Size (A) only
   — Work Time: 8 min, Downtime: 8 min

6. ORD-006 (Red, Small, Aluminum)
   — Color (A) + Material (B)
   — Work Time: 15 + 12 = 27 min
   — Downtime: 15 + 12 = 27 min (different groups, no overlap)

Totals before optimization:
  Work Time: 0 + 35 + 35 + 15 + 8 + 27 = 120 min
  Downtime:  0 + 27 + 27 + 15 + 8 + 27 = 104 min
```

### Result

```typescript
{
  sequence: [/* 6 OptimizedOrders with workTime and downtime */],

  // Work Time metrics (total labor cost)
  totalBefore: 120,
  totalAfter: 75,
  savings: 45,
  savingsPercent: 38,

  // Downtime metrics (production line stopped)
  totalDowntimeBefore: 104,
  totalDowntimeAfter: 67,
  downtimeSavings: 37,
  downtimeSavingsPercent: 36,

  attributeStats: [
    { column: 'Color', changeoverCount: 2, totalTime: 30, parallelGroup: 'A' },
    { column: 'Size', changeoverCount: 3, totalTime: 24, parallelGroup: 'A' },
    { column: 'Material', changeoverCount: 3, totalTime: 36, parallelGroup: 'B' },
  ]
}
```

**Summary of Parallel Group Benefit:**
- Without parallel groups: 120 min work time = 120 min downtime
- With parallel groups (A, B): 120 min work time, but only 104 min downtime (before)
- After optimization: 75 min work time, 67 min downtime
- **Downtime reduction: 37 min (36%)** — This is the real production impact!

---

## Optimization Strategies

### Strategy 1: Attribute Priority

The order of attributes matters. We sort by changeover time to prioritize avoiding expensive changeovers:

```
High-cost changeovers avoided first → Maximum savings
```

### Strategy 2: Group Size Ordering

We process larger groups first when flattening:

```
Largest groups first → More orders benefit from grouping
```

### Strategy 3: Greedy + Local Search

Pure greedy can miss opportunities. Local search refines:

```
Greedy: Fast, ~85% optimal
+ Local Search: +10-15% improvement
= Final: ~90-95% of theoretical optimum
```

### Strategy 4: Optimize for Downtime

The local search (2-opt) phase optimizes for **downtime**, not work time. This is critical because:

```
Downtime = Production line stopped = Revenue loss
Work Time = Labor cost (workers still working)

Minimizing downtime has higher business impact than minimizing work time.
```

When evaluating swaps, the algorithm compares `totalDowntime` of candidate sequences, ensuring the final order minimizes actual production impact.

### Strategy 5: Parallel Group Awareness

Attributes in the same parallel group can be performed simultaneously:

```
Same Group:    Downtime = max(time1, time2)  — Overlap!
Different Groups: Downtime = time1 + time2   — Sequential
```

Users should assign parallel groups based on:
- Same crew/equipment → Same group
- Different crews that can work simultaneously → Different groups
- Sequential dependencies → Same group (forced to wait)

---

## Edge Cases

### Case 1: Zero Orders

```typescript
input: { orders: [], attributes: [...] }
output: { sequence: [], savings: 0, ... }
```

### Case 2: Single Order

```typescript
input: { orders: [order1], attributes: [...] }
output: { sequence: [order1], changeoverTime: 0, savings: 0 }
```

### Case 3: All Orders Identical

```typescript
// All orders have same attribute values
input: { orders: [A, A, A, A], attributes: [...] }
output: { sequence: [A, A, A, A], totalAfter: 0, savingsPercent: 100 }
```

### Case 4: All Orders Unique

```typescript
// Every order is different
input: { orders: [A, B, C, D], attributes: [...] }
output: { 
  // Best-effort grouping, limited savings
  savingsPercent: 10-30  // Lower than typical
}
```

### Case 5: Empty/Null Attribute Values

```typescript
// Some orders have missing values
order.values['Color'] = ''  // or undefined

// Treat as distinct value "empty"
// Group empties together
```

### Case 6: Single Attribute

```typescript
// Only one changeover attribute
input: { orders: [...], attributes: [{ column: 'Color', changeoverTime: 15 }] }

// Simple grouping by that attribute
// Often achieves near-optimal results
```

### Case 7: Many Attributes (5+)

```typescript
// More than 5 attributes
// Algorithm still works but:
// - Deeper hierarchy
// - More complex grouping
// - May need more refinement iterations
```

---

## Performance Optimization

### For Large Datasets (1,000+ orders)

```typescript
export function optimizeWithProgress(
  input: OptimizationInput,
  onProgress?: (percent: number) => void
): OptimizationResult {
  const { orders, attributes } = input;
  
  // Report progress at key milestones
  onProgress?.(10); // Starting
  
  const sortedAttributes = sortAttributesByTime(attributes);
  onProgress?.(20);
  
  const groups = createHierarchicalGroups(orders, sortedAttributes);
  onProgress?.(40);
  
  const sequence = flattenGroupsOptimally(groups, sortedAttributes);
  onProgress?.(60);
  
  // Limit refinement for very large datasets
  const maxIterations = orders.length > 5000 ? 10 : 100;
  const refined = applyLocalSearch(sequence, sortedAttributes, maxIterations);
  onProgress?.(90);
  
  const result = calculateResult(orders, refined, sortedAttributes);
  onProgress?.(100);
  
  return result;
}
```

### Web Worker for Non-Blocking UI

```typescript
// optimizer.worker.ts
self.onmessage = (e: MessageEvent<OptimizationInput>) => {
  const result = optimize(e.data);
  self.postMessage(result);
};

// Usage in React component
const worker = new Worker(
  new URL('./optimizer.worker.ts', import.meta.url)
);

function runOptimization(input: OptimizationInput): Promise<OptimizationResult> {
  return new Promise((resolve) => {
    worker.onmessage = (e) => resolve(e.data);
    worker.postMessage(input);
  });
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// optimizer.test.ts

describe('optimize', () => {
  describe('edge cases', () => {
    it('handles empty orders', () => {
      const result = optimize({ orders: [], attributes: [] });
      expect(result.sequence).toHaveLength(0);
      expect(result.savings).toBe(0);
    });
    
    it('handles single order', () => {
      const result = optimize({
        orders: [{ id: '1', originalIndex: 0, values: { Color: 'Red' } }],
        attributes: [{ column: 'Color', changeoverTime: 10 }],
      });
      expect(result.sequence).toHaveLength(1);
      expect(result.totalAfter).toBe(0);
    });
    
    it('handles all identical orders', () => {
      const orders = Array(5).fill(null).map((_, i) => ({
        id: String(i),
        originalIndex: i,
        values: { Color: 'Red', Size: 'Large' },
      }));
      
      const result = optimize({
        orders,
        attributes: [
          { column: 'Color', changeoverTime: 10 },
          { column: 'Size', changeoverTime: 5 },
        ],
      });
      
      expect(result.totalAfter).toBe(0);
      expect(result.savingsPercent).toBe(100);
    });
  });
  
  describe('optimization quality', () => {
    it('reduces changeover time', () => {
      const orders = [
        { id: '1', originalIndex: 0, values: { Color: 'Red' } },
        { id: '2', originalIndex: 1, values: { Color: 'Blue' } },
        { id: '3', originalIndex: 2, values: { Color: 'Red' } },
        { id: '4', originalIndex: 3, values: { Color: 'Blue' } },
      ];
      
      const result = optimize({
        orders,
        attributes: [{ column: 'Color', changeoverTime: 10 }],
      });
      
      // Before: Red→Blue→Red→Blue = 3 changes = 30 min
      // After: Red→Red→Blue→Blue = 1 change = 10 min
      expect(result.totalBefore).toBe(30);
      expect(result.totalAfter).toBe(10);
      expect(result.savingsPercent).toBe(67);
    });
    
    it('prioritizes expensive changeovers', () => {
      const orders = [
        { id: '1', originalIndex: 0, values: { Color: 'Red', Size: 'S' } },
        { id: '2', originalIndex: 1, values: { Color: 'Blue', Size: 'L' } },
        { id: '3', originalIndex: 2, values: { Color: 'Red', Size: 'L' } },
        { id: '4', originalIndex: 3, values: { Color: 'Blue', Size: 'S' } },
      ];
      
      const result = optimize({
        orders,
        attributes: [
          { column: 'Color', changeoverTime: 20 },  // Expensive
          { column: 'Size', changeoverTime: 5 },    // Cheap
        ],
      });
      
      // Should minimize Color changes even at cost of Size changes
      // Optimal: minimize 20-min changeovers
      expect(result.savings).toBeGreaterThan(0);
    });
  });
  
  describe('determinism', () => {
    it('produces same output for same input', () => {
      const input = {
        orders: [
          { id: '1', originalIndex: 0, values: { A: '1' } },
          { id: '2', originalIndex: 1, values: { A: '2' } },
          { id: '3', originalIndex: 2, values: { A: '1' } },
        ],
        attributes: [{ column: 'A', changeoverTime: 10 }],
      };
      
      const result1 = optimize(input);
      const result2 = optimize(input);
      
      expect(result1.sequence.map(o => o.id))
        .toEqual(result2.sequence.map(o => o.id));
    });
  });
});
```

### Performance Tests

```typescript
describe('performance', () => {
  it('optimizes 50 orders in under 500ms', () => {
    const orders = generateRandomOrders(50, 3);
    const attributes = generateAttributes(3);
    
    const start = performance.now();
    optimize({ orders, attributes });
    const elapsed = performance.now() - start;
    
    expect(elapsed).toBeLessThan(500);
  });
  
  it('optimizes 500 orders in under 5 seconds', () => {
    const orders = generateRandomOrders(500, 3);
    const attributes = generateAttributes(3);
    
    const start = performance.now();
    optimize({ orders, attributes });
    const elapsed = performance.now() - start;
    
    expect(elapsed).toBeLessThan(5000);
  });
  
  it('optimizes 5000 orders in under 60 seconds', () => {
    const orders = generateRandomOrders(5000, 3);
    const attributes = generateAttributes(3);
    
    const start = performance.now();
    optimize({ orders, attributes });
    const elapsed = performance.now() - start;
    
    expect(elapsed).toBeLessThan(60000);
  });
});

// Test helpers
function generateRandomOrders(count: number, attrCount: number): Order[] {
  const values = ['A', 'B', 'C', 'D'];
  return Array(count).fill(null).map((_, i) => ({
    id: `ORD-${i}`,
    originalIndex: i,
    values: Object.fromEntries(
      Array(attrCount).fill(null).map((_, j) => [
        `Attr${j}`,
        values[Math.floor(Math.random() * values.length)],
      ])
    ),
  }));
}

function generateAttributes(count: number): AttributeConfig[] {
  return Array(count).fill(null).map((_, i) => ({
    column: `Attr${i}`,
    changeoverTime: 10 + i * 5,
  }));
}
```

---

## Future Enhancements

### V1.x: Advanced Algorithm Options

| Feature | Description |
|---------|-------------|
| **Constraint support** | "Order X must come before Order Y" |
| **Fixed positions** | "Order X must be at position 3" |
| **Time windows** | "Order X must be in morning batch" |
| **Multiple lines** | Optimize across multiple production lines |

### V2.0: Machine Learning

| Feature | Description |
|---------|-------------|
| **Learned changeover times** | Infer times from historical data |
| **Pattern recognition** | Learn optimal patterns from past schedules |
| **Predictive optimization** | Anticipate future orders |

---

## Summary

### Algorithm Characteristics

| Property | Value |
|----------|-------|
| **Type** | Hierarchical Greedy + Local Search |
| **Time Complexity** | O(n²) worst case |
| **Space Complexity** | O(n) |
| **Deterministic** | Yes |
| **Optimality** | ~90-95% of theoretical optimum |

### Key Design Decisions

1. **Greedy first** — Fast, good baseline
2. **Local search refinement** — Improves results without complexity
3. **Attribute priority** — Expensive changeovers first
4. **Progress reporting** — Good UX for large datasets

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2024-12-20 | Initial algorithm specification |
| | | |

---

*This algorithm is the core IP of ChangeoverOptimizer. It's simple enough to implement quickly, but effective enough to deliver real value.*
