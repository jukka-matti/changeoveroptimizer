import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultsScreen } from './ResultsScreen';
import type { OptimizationResult, AttributeConfig } from '@/types';

interface ChangeoverConfig {
  orderIdColumn: string;
  attributes: AttributeConfig[];
}

// Mock dependencies
vi.mock('@/stores/app-store');
vi.mock('@/stores/data-store');
vi.mock('@/components/features/ResultsChart', () => ({
  ResultsChart: ({ result }: any) => (
    <div data-testid="results-chart">Chart for {result.sequence.length} orders</div>
  ),
}));

// Import mocked modules
import { useAppStore } from '@/stores/app-store';
import { useDataStore } from '@/stores/data-store';

describe('ResultsScreen', () => {
  const mockNavigateTo = vi.fn();

  const mockConfig: ChangeoverConfig = {
    orderIdColumn: 'Order ID',
    attributes: [
      { column: 'Color', changeoverTime: 15, parallelGroup: 'default' },
      { column: 'Size', changeoverTime: 10, parallelGroup: 'A' },
    ],
  };

  const mockResult: OptimizationResult = {
    sequence: [
      {
        id: 'ORD-001',
        originalIndex: 0,
        sequenceNumber: 1,
        values: { Color: 'Red', Size: 'Large' },
        changeoverTime: 0,
        changeoverReasons: [],
        workTime: 0,
        downtime: 0,
      },
      {
        id: 'ORD-002',
        originalIndex: 1,
        sequenceNumber: 2,
        values: { Color: 'Red', Size: 'Small' },
        changeoverTime: 10,
        changeoverReasons: ['Size changed from Large to Small'],
        workTime: 10,
        downtime: 10,
      },
      {
        id: 'ORD-003',
        originalIndex: 2,
        sequenceNumber: 3,
        values: { Color: 'Blue', Size: 'Small' },
        changeoverTime: 15,
        changeoverReasons: ['Color changed from Red to Blue'],
        workTime: 15,
        downtime: 15,
      },
    ],
    totalBefore: 50,
    totalAfter: 25,
    savings: 25,
    savingsPercent: 50,
    totalDowntimeBefore: 45,
    totalDowntimeAfter: 25,
    downtimeSavings: 20,
    downtimeSavingsPercent: 44,
    attributeStats: [
      {
        column: 'Color',
        changeoverCount: 1,
        totalTime: 15,
        parallelGroup: 'default',
      },
      {
        column: 'Size',
        changeoverCount: 1,
        totalTime: 10,
        parallelGroup: 'A',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useAppStore
    vi.mocked(useAppStore).mockReturnValue({
      navigateTo: mockNavigateTo,
      currentScreen: 'results',
      isLoading: false,
      loadingMessage: '',
      error: null,
      setLoading: vi.fn(),
      setError: vi.fn(),
      clearError: vi.fn(),
      reset: vi.fn(),
    } as any);

    // Mock useDataStore with result
    vi.mocked(useDataStore).mockReturnValue({
      result: mockResult,
      config: mockConfig,
      sourceFile: null,
      orderIdColumn: 'Order ID',
      setSourceFile: vi.fn(),
      setOrderIdColumn: vi.fn(),
      addAttribute: vi.fn(),
      updateAttribute: vi.fn(),
      removeAttribute: vi.fn(),
      setResult: vi.fn(),
      reset: vi.fn(),
    } as any);
  });

  describe('Rendering with Results', () => {
    it('should render title and description', () => {
      render(<ResultsScreen />);

      expect(screen.getByText('Optimization Results')).toBeInTheDocument();
      expect(screen.getByText('Sequence optimized to minimize changeover time.')).toBeInTheDocument();
    });

    it('should render navigation buttons', () => {
      render(<ResultsScreen />);

      expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Export Schedule/i })).toBeInTheDocument();
    });

    it('should render downtime summary cards', () => {
      render(<ResultsScreen />);

      expect(screen.getByText('Original Downtime')).toBeInTheDocument();
      expect(screen.getByText('45 min')).toBeInTheDocument();

      expect(screen.getByText('Optimized Downtime')).toBeInTheDocument();
      expect(screen.getByText('25 min')).toBeInTheDocument();

      expect(screen.getByText('Downtime Saved')).toBeInTheDocument();
      expect(screen.getByText('20 min')).toBeInTheDocument();
      expect(screen.getByText('44% reduction')).toBeInTheDocument();
    });

    it('should render orders count card', () => {
      render(<ResultsScreen />);

      expect(screen.getByText('Orders')).toBeInTheDocument();
      expect(screen.getByText('Total orders sequenced')).toBeInTheDocument();

      // Get the Orders card specifically
      const ordersCard = screen.getByText('Orders').closest('.rounded-xl');
      expect(ordersCard).toHaveTextContent('3');
    });

    it('should render work time alongside downtime', () => {
      render(<ResultsScreen />);

      // Work time displayed as secondary info in cards
      expect(screen.getByText(/Work time: 50 min/)).toBeInTheDocument();
      expect(screen.getByText(/Work time: 25 min/)).toBeInTheDocument();
    });

    it('should render results chart component', () => {
      render(<ResultsScreen />);

      expect(screen.getByTestId('results-chart')).toBeInTheDocument();
      expect(screen.getByText('Chart for 3 orders')).toBeInTheDocument();
    });
  });

  describe('Attribute Stats', () => {
    it('should render attribute impact section', () => {
      render(<ResultsScreen />);

      expect(screen.getByText('Attribute Impact')).toBeInTheDocument();
      expect(screen.getByText('Breakdown of changeover costs by attribute and parallel group.')).toBeInTheDocument();
    });

    it('should display all attribute stats', () => {
      render(<ResultsScreen />);

      // Find the Attribute Impact section
      const attributeSection = screen.getByText('Attribute Impact').closest('.rounded-xl');
      expect(attributeSection).toBeInTheDocument();

      // Both attributes should have their change counts (2 instances of "1 changes")
      expect(screen.getAllByText('1 changes')).toHaveLength(2);

      // Total times
      expect(screen.getByText('15 min')).toBeInTheDocument(); // Color
      expect(screen.getByText('10 min')).toBeInTheDocument(); // Size
    });

    it('should show parallel group for non-default groups', () => {
      render(<ResultsScreen />);

      // Size is in group A, should show "Group A"
      expect(screen.getByText(/Group A/)).toBeInTheDocument();

      // Color is in default group, should not show group label
      const attributeSection = screen.getByText('Attribute Impact').closest('.rounded-xl');
      expect(attributeSection?.textContent).not.toContain('Group default');
    });

    it('should display percentage of work time', () => {
      render(<ResultsScreen />);

      // Color: 15 / 25 = 60%
      expect(screen.getByText('60% of work')).toBeInTheDocument();

      // Size: 10 / 25 = 40%
      expect(screen.getByText('40% of work')).toBeInTheDocument();
    });
  });

  describe('Sequence Table', () => {
    it('should render table with header', () => {
      render(<ResultsScreen />);

      expect(screen.getByText('Optimized Sequence')).toBeInTheDocument();
      expect(screen.getByText('Detailed step-by-step production schedule.')).toBeInTheDocument();
    });

    it('should render table headers', () => {
      render(<ResultsScreen />);

      // Get table headers
      const headers = screen.getAllByRole('columnheader');
      const headerTexts = headers.map(h => h.textContent);

      expect(headerTexts).toContain('#');
      expect(headerTexts).toContain('Order ID');
      expect(headerTexts.some(t => t?.includes('Color'))).toBe(true);
      expect(headerTexts.some(t => t?.includes('Size'))).toBe(true);
      expect(headerTexts.some(t => t?.includes('Downtime'))).toBe(true);
    });

    it('should render all orders in sequence', () => {
      render(<ResultsScreen />);

      expect(screen.getByText('ORD-001')).toBeInTheDocument();
      expect(screen.getByText('ORD-002')).toBeInTheDocument();
      expect(screen.getByText('ORD-003')).toBeInTheDocument();
    });

    it('should display order attributes', () => {
      render(<ResultsScreen />);

      // Check that all attribute values appear in the table
      const table = screen.getByRole('table');

      expect(table.textContent).toContain('Red');
      expect(table.textContent).toContain('Large');
      expect(table.textContent).toContain('Small');
      expect(table.textContent).toContain('Blue');
    });

    it('should display changeover times correctly', () => {
      render(<ResultsScreen />);

      // Order 2 has +10m downtime
      expect(screen.getByText('+10m')).toBeInTheDocument();

      // Order 3 has +15m downtime
      expect(screen.getByText('+15m')).toBeInTheDocument();
    });

    it('should show dash for orders with no changeover', () => {
      render(<ResultsScreen />);

      // Order 1 has no changeover, should show dash
      const rows = screen.getAllByRole('row');
      const firstOrderRow = rows.find(row => row.textContent?.includes('ORD-001'));
      expect(firstOrderRow?.textContent).toContain('—');
    });

    it('should display sequence numbers', () => {
      render(<ResultsScreen />);

      // Sequence numbers 1, 2, 3
      const rows = screen.getAllByRole('row');
      expect(rows.some(row => row.textContent?.includes('1'))).toBe(true);
      expect(rows.some(row => row.textContent?.includes('2'))).toBe(true);
      expect(rows.some(row => row.textContent?.includes('3'))).toBe(true);
    });
  });

  describe('Navigation', () => {
    it('should navigate back to changeover config on back button click', async () => {
      const user = userEvent.setup();
      render(<ResultsScreen />);

      const backButton = screen.getByRole('button', { name: /Back/i });
      await user.click(backButton);

      expect(mockNavigateTo).toHaveBeenCalledTimes(1);
      expect(mockNavigateTo).toHaveBeenCalledWith('changeover-config');
    });

    it('should navigate to export on export button click', async () => {
      const user = userEvent.setup();
      render(<ResultsScreen />);

      const exportButton = screen.getByRole('button', { name: /Export Schedule/i });
      await user.click(exportButton);

      expect(mockNavigateTo).toHaveBeenCalledTimes(1);
      expect(mockNavigateTo).toHaveBeenCalledWith('export');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no result', () => {
      vi.mocked(useDataStore).mockReturnValue({
        result: null,
        config: mockConfig,
        sourceFile: null,
        orderIdColumn: '',
        setSourceFile: vi.fn(),
        setOrderIdColumn: vi.fn(),
        addAttribute: vi.fn(),
        updateAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        setResult: vi.fn(),
        reset: vi.fn(),
      } as any);

      render(<ResultsScreen />);

      expect(screen.getByText('No optimization results found.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Start Over/i })).toBeInTheDocument();
    });

    it('should navigate to welcome on start over button click', async () => {
      const user = userEvent.setup();

      vi.mocked(useDataStore).mockReturnValue({
        result: null,
        config: mockConfig,
        sourceFile: null,
        orderIdColumn: '',
        setSourceFile: vi.fn(),
        setOrderIdColumn: vi.fn(),
        addAttribute: vi.fn(),
        updateAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        setResult: vi.fn(),
        reset: vi.fn(),
      } as any);

      render(<ResultsScreen />);

      const startOverButton = screen.getByRole('button', { name: /Start Over/i });
      await user.click(startOverButton);

      expect(mockNavigateTo).toHaveBeenCalledTimes(1);
      expect(mockNavigateTo).toHaveBeenCalledWith('welcome');
    });

    it('should not render results content when no result', () => {
      vi.mocked(useDataStore).mockReturnValue({
        result: null,
        config: mockConfig,
        sourceFile: null,
        orderIdColumn: '',
        setSourceFile: vi.fn(),
        setOrderIdColumn: vi.fn(),
        addAttribute: vi.fn(),
        updateAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        setResult: vi.fn(),
        reset: vi.fn(),
      } as any);

      render(<ResultsScreen />);

      expect(screen.queryByText('Optimization Results')).not.toBeInTheDocument();
      expect(screen.queryByText('Original Downtime')).not.toBeInTheDocument();
      expect(screen.queryByTestId('results-chart')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle result with many orders', () => {
      const largeSequence = Array.from({ length: 100 }, (_, i) => ({
        id: `ORD-${String(i + 1).padStart(3, '0')}`,
        originalIndex: i,
        sequenceNumber: i + 1,
        values: { Color: i % 2 === 0 ? 'Red' : 'Blue', Size: 'Medium' },
        changeoverTime: i === 0 ? 0 : 15,
        changeoverReasons: i === 0 ? [] : ['Color changed'],
        workTime: i === 0 ? 0 : 15,
        downtime: i === 0 ? 0 : 15,
      }));

      const largeResult: OptimizationResult = {
        ...mockResult,
        sequence: largeSequence,
      };

      vi.mocked(useDataStore).mockReturnValue({
        result: largeResult,
        config: mockConfig,
        sourceFile: null,
        orderIdColumn: 'Order ID',
        setSourceFile: vi.fn(),
        setOrderIdColumn: vi.fn(),
        addAttribute: vi.fn(),
        updateAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        setResult: vi.fn(),
        reset: vi.fn(),
      } as any);

      render(<ResultsScreen />);

      // Check orders count in the card
      const ordersCard = screen.getByText('Orders').closest('.rounded-xl');
      expect(ordersCard).toHaveTextContent('100');

      // Check specific orders in table
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
      expect(screen.getByText('ORD-100')).toBeInTheDocument();
    });

    it('should handle result with zero savings', () => {
      const noSavingsResult: OptimizationResult = {
        ...mockResult,
        totalBefore: 25,
        totalAfter: 25,
        savings: 0,
        savingsPercent: 0,
        totalDowntimeBefore: 25,
        totalDowntimeAfter: 25,
        downtimeSavings: 0,
        downtimeSavingsPercent: 0,
      };

      vi.mocked(useDataStore).mockReturnValue({
        result: noSavingsResult,
        config: mockConfig,
        sourceFile: null,
        orderIdColumn: 'Order ID',
        setSourceFile: vi.fn(),
        setOrderIdColumn: vi.fn(),
        addAttribute: vi.fn(),
        updateAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        setResult: vi.fn(),
        reset: vi.fn(),
      } as any);

      render(<ResultsScreen />);

      expect(screen.getByText('0 min')).toBeInTheDocument();
      expect(screen.getByText('0% reduction')).toBeInTheDocument();
    });

    it('should handle result with empty attribute stats', () => {
      const noStatsResult: OptimizationResult = {
        ...mockResult,
        attributeStats: [],
      };

      vi.mocked(useDataStore).mockReturnValue({
        result: noStatsResult,
        config: mockConfig,
        sourceFile: null,
        orderIdColumn: 'Order ID',
        setSourceFile: vi.fn(),
        setOrderIdColumn: vi.fn(),
        addAttribute: vi.fn(),
        updateAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        setResult: vi.fn(),
        reset: vi.fn(),
      } as any);

      render(<ResultsScreen />);

      // Should still render the Attribute Impact section header
      expect(screen.getByText('Attribute Impact')).toBeInTheDocument();

      // No attribute stat cards in the Attribute Impact section
      const attributeSection = screen.getByText('Attribute Impact').closest('.rounded-xl');
      const statCards = attributeSection?.querySelectorAll('.border-l-4');
      expect(statCards?.length || 0).toBe(0);
    });

    it('should handle custom order ID column name', () => {
      const customConfig: ChangeoverConfig = {
        orderIdColumn: 'ProductCode',
        attributes: mockConfig.attributes,
      };

      vi.mocked(useDataStore).mockReturnValue({
        result: mockResult,
        config: customConfig,
        sourceFile: null,
        orderIdColumn: 'ProductCode',
        setSourceFile: vi.fn(),
        setOrderIdColumn: vi.fn(),
        addAttribute: vi.fn(),
        updateAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        setResult: vi.fn(),
        reset: vi.fn(),
      } as any);

      render(<ResultsScreen />);

      expect(screen.getByText('ProductCode')).toBeInTheDocument();
    });

    it('should display work time when different from downtime', () => {
      const parallelResult: OptimizationResult = {
        ...mockResult,
        sequence: [
          {
            id: 'ORD-001',
            originalIndex: 0,
            sequenceNumber: 1,
            values: { Color: 'Red', Size: 'Large' },
            changeoverTime: 25,
            changeoverReasons: ['Color changed', 'Size changed'],
            workTime: 25, // Sum of parallel activities
            downtime: 15, // Max of parallel activities
          },
        ],
      };

      vi.mocked(useDataStore).mockReturnValue({
        result: parallelResult,
        config: mockConfig,
        sourceFile: null,
        orderIdColumn: 'Order ID',
        setSourceFile: vi.fn(),
        setOrderIdColumn: vi.fn(),
        addAttribute: vi.fn(),
        updateAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        setResult: vi.fn(),
        reset: vi.fn(),
      } as any);

      render(<ResultsScreen />);

      // Should show both downtime and work time
      expect(screen.getByText('+15m')).toBeInTheDocument(); // Downtime badge
      expect(screen.getByText('+25m')).toBeInTheDocument(); // Work time text
    });
  });

  describe('Accessibility', () => {
    it('should have proper table structure', () => {
      render(<ResultsScreen />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Should have table headers
      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThan(0);

      // Should have table rows
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // Header + data rows
    });

    it('should have clickable buttons', async () => {
      const user = userEvent.setup();
      render(<ResultsScreen />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2); // Back + Export

      // Buttons should be clickable
      await user.click(buttons[0]);
      expect(mockNavigateTo).toHaveBeenCalled();
    });

    it('should have proper heading hierarchy', () => {
      render(<ResultsScreen />);

      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toHaveTextContent('Optimization Results');
    });
  });
});
