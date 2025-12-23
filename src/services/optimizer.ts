import { 
  Order, 
  AttributeConfig, 
  OptimizedOrder, 
  OptimizationResult, 
  AttributeStat 
} from '@/types';

/**
 * Main optimization entry point.
 * Uses Hierarchical Greedy with Refinement (2-opt).
 */
export function optimize(
  orders: Order[],
  attributes: AttributeConfig[]
): OptimizationResult {
  if (orders.length === 0) return createEmptyResult();
  if (orders.length === 1) return createSingleOrderResult(orders[0]);

  // Phase 1: Preparation (Attributes are already prioritized by user order)
  const prioritizedAttributes = attributes;

  // Phase 2: Hierarchical Grouping
  const groups = createHierarchicalGroups(orders, prioritizedAttributes);

  // Phase 3: Flatten into sequence
  const initialSequence = flattenGroupsOptimally(groups, prioritizedAttributes);

  // Phase 4: Refinement (2-opt local search)
  const refinedSequence = applyLocalSearch(initialSequence, prioritizedAttributes);

  // Phase 5: Final Calculations
  return calculateOptimizationResult(orders, refinedSequence, prioritizedAttributes);
}

interface OrderGroup {
  key: string;
  orders: Order[];
  subgroups?: OrderGroup[];
}

function createHierarchicalGroups(
  orders: Order[],
  attributes: AttributeConfig[],
  depth: number = 0
): OrderGroup[] {
  if (depth >= attributes.length) return [];

  const attribute = attributes[depth];
  const groupMap = new Map<string, Order[]>();

  for (const order of orders) {
    const value = String(order.values[attribute.column] ?? '');
    if (!groupMap.has(value)) {
      groupMap.set(value, []);
    }
    groupMap.get(value)!.push(order);
  }

  const groups: OrderGroup[] = [];
  for (const [key, groupOrders] of groupMap) {
    const group: OrderGroup = { key, orders: groupOrders };
    if (depth < attributes.length - 1) {
      group.subgroups = createHierarchicalGroups(groupOrders, attributes, depth + 1);
    }
    groups.push(group);
  }

  return groups;
}

function flattenGroupsOptimally(
  groups: OrderGroup[],
  attributes: AttributeConfig[]
): Order[] {
  if (groups.length === 0) return [];

  // Sort groups by size to handle common values together
  const sortedGroups = [...groups].sort((a, b) => b.orders.length - a.orders.length);

  const result: Order[] = [];
  for (const group of sortedGroups) {
    if (group.subgroups && group.subgroups.length > 0) {
      result.push(...flattenGroupsOptimally(group.subgroups, attributes.slice(1)));
    } else {
      result.push(...group.orders);
    }
  }
  return result;
}

/**
 * Apply 2-opt local search to refine the sequence.
 * Optimizes for DOWNTIME (production impact) rather than work time.
 */
function applyLocalSearch(
  sequence: Order[],
  attributes: AttributeConfig[],
  maxIterations: number = 100
): Order[] {
  if (sequence.length <= 2) return sequence;

  let current = [...sequence];
  // Optimize for downtime (production impact), not work time
  let currentCost = calculateTotalChangeoverMetrics(current, attributes).totalDowntime;
  let improved = true;
  let iterations = 0;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 0; i < current.length - 1; i++) {
      // 2-opt: swap adjacent
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

interface ChangeoverMetrics {
  workTime: number;   // Sum of all changeover times (labor cost)
  downtime: number;   // Max per parallel group, sum across groups (production impact)
  reasons: string[];
}

/**
 * Calculate changeover metrics between two orders.
 * workTime = sum of all attribute changeover times
 * downtime = max within each parallel group, then sum across groups
 */
function calculateChangeoverWithParallelism(
  prev: Order,
  curr: Order,
  attributes: AttributeConfig[]
): ChangeoverMetrics {
  let workTime = 0;
  const reasons: string[] = [];
  const groupTimes = new Map<string, number>();

  for (const attr of attributes) {
    if (prev.values[attr.column] !== curr.values[attr.column]) {
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

function calculateOptimizationResult(
  original: Order[],
  optimized: Order[],
  attributes: AttributeConfig[]
): OptimizationResult {
  // Calculate "before" metrics for original sequence
  const beforeMetrics = calculateTotalChangeoverMetrics(original, attributes);

  // Build optimized orders with both work time and downtime
  const sequence: OptimizedOrder[] = optimized.map((order, index) => {
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
    const metrics = calculateChangeoverWithParallelism(optimized[index - 1], order, attributes);
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
  const attributeStats: AttributeStat[] = attributes.map(attr => {
    let count = 0;
    let time = 0;
    sequence.forEach(order => {
      if (order.changeoverReasons.includes(attr.column)) {
        count++;
        time += attr.changeoverTime;
      }
    });
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


