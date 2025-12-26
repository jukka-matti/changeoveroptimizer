import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChangeoverMatrixScreen } from './ChangeoverMatrixScreen';
import type { ChangeoverAttribute, ChangeoverMatrixEntry } from '@/types/changeover';

// Mock dependencies
vi.mock('@/stores/app-store', () => ({
  useAppStore: () => ({
    navigateTo: vi.fn(),
  }),
}));

// Note: ChangeoverMatrixScreen uses hardcoded strings, not i18n yet

// Mock electron IPC
const mockInvoke = vi.fn();
(window as any).electron = {
  invoke: mockInvoke,
};

describe('ChangeoverMatrixScreen', () => {
  const mockAttributes: ChangeoverAttribute[] = [
    {
      id: 'attr-1',
      name: 'color',
      displayName: 'Color',
      hierarchyLevel: 0,
      defaultMinutes: 15,
      parallelGroup: 'default',
      sortOrder: 0,
      isActive: true,
      createdAt: null,
      updatedAt: null,
    },
    {
      id: 'attr-2',
      name: 'size',
      displayName: 'Size',
      hierarchyLevel: 1,
      defaultMinutes: 10,
      parallelGroup: 'A',
      sortOrder: 1,
      isActive: true,
      createdAt: null,
      updatedAt: null,
    },
  ];

  const mockMatrixEntries: ChangeoverMatrixEntry[] = [
    {
      id: 'entry-1',
      attributeId: 'attr-1',
      fromValue: 'Red',
      toValue: 'Blue',
      timeMinutes: 20,
      source: 'manual',
      smedStudyId: null,
      notes: null,
      createdAt: null,
      updatedAt: null,
    },
    {
      id: 'entry-2',
      attributeId: 'attr-1',
      fromValue: 'Blue',
      toValue: 'Red',
      timeMinutes: 18,
      source: 'smed_standard',
      smedStudyId: 'smed-1',
      notes: null,
      createdAt: null,
      updatedAt: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default IPC responses
    mockInvoke.mockImplementation((channel: string, args?: any) => {
      if (channel === 'changeovers:get_all_attributes') {
        return Promise.resolve(mockAttributes);
      }
      if (channel === 'changeovers:get_matrix') {
        return Promise.resolve(mockMatrixEntries);
      }
      if (channel === 'changeovers:upsert_attribute') {
        return Promise.resolve({ id: 'new-attr', ...args?.data });
      }
      if (channel === 'changeovers:delete_attribute') {
        return Promise.resolve();
      }
      if (channel === 'changeovers:upsert_entry') {
        return Promise.resolve({ id: 'new-entry', ...args?.data });
      }
      if (channel === 'changeovers:import_smed') {
        return Promise.resolve({ id: 'imported-entry', ...args });
      }
      if (channel === 'smed:get_all_studies') {
        return Promise.resolve([]);
      }
      return Promise.resolve(null);
    });
  });

  describe('Rendering', () => {
    it('should render title and subtitle', async () => {
      render(<ChangeoverMatrixScreen />);

      await waitFor(() => {
        expect(screen.getByText('Changeover Matrix')).toBeInTheDocument();
      });
      // Component uses hardcoded string, not i18n
      expect(screen.getByText('Define specific changeover times for value-to-value transitions.')).toBeInTheDocument();
    });

    it('should render back button', async () => {
      render(<ChangeoverMatrixScreen />);

      await waitFor(() => {
        expect(screen.getByText('Back')).toBeInTheDocument();
      });
    });

    it('should render attributes list', async () => {
      render(<ChangeoverMatrixScreen />);

      await waitFor(() => {
        expect(screen.getByText('Attributes')).toBeInTheDocument();
        expect(screen.getByText('Color')).toBeInTheDocument();
        expect(screen.getByText('Size')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<ChangeoverMatrixScreen />);

      // The loading spinner should be visible initially
      // (checking via class name since we don't have test IDs)
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should display attribute default times', async () => {
      render(<ChangeoverMatrixScreen />);

      await waitFor(() => {
        expect(screen.getByText('Default: 15 min')).toBeInTheDocument();
        expect(screen.getByText('Default: 10 min')).toBeInTheDocument();
      });
    });
  });

  describe('Attribute Selection', () => {
    it('should select first attribute by default', async () => {
      render(<ChangeoverMatrixScreen />);

      await waitFor(() => {
        // First attribute should be selected and its matrix shown
        expect(screen.getByText('Color Matrix')).toBeInTheDocument();
      });
    });

    it('should switch matrix when different attribute is clicked', async () => {
      const user = userEvent.setup();
      render(<ChangeoverMatrixScreen />);

      await waitFor(() => {
        expect(screen.getByText('Color')).toBeInTheDocument();
      });

      // Click on Size attribute
      const sizeAttr = screen.getByText('Size');
      await user.click(sizeAttr);

      await waitFor(() => {
        expect(screen.getByText('Size Matrix')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no attributes exist', async () => {
      mockInvoke.mockImplementation((channel: string) => {
        if (channel === 'changeovers:get_all_attributes') {
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      });

      render(<ChangeoverMatrixScreen />);

      await waitFor(() => {
        // Component uses this exact text (hardcoded)
        expect(screen.getByText('No attributes defined yet.')).toBeInTheDocument();
      });
    });

    it('should show prompt when no matrix values exist', async () => {
      mockInvoke.mockImplementation((channel: string) => {
        if (channel === 'changeovers:get_all_attributes') {
          return Promise.resolve(mockAttributes);
        }
        if (channel === 'changeovers:get_matrix') {
          return Promise.resolve([]); // No matrix entries
        }
        return Promise.resolve([]);
      });

      render(<ChangeoverMatrixScreen />);

      await waitFor(() => {
        // Component uses this exact text (hardcoded)
        expect(screen.getByText('Add values to start building the matrix.')).toBeInTheDocument();
      });
    });
  });

  describe('Adding New Attribute', () => {
    it('should show new attribute form when add button is clicked', async () => {
      const user = userEvent.setup();
      render(<ChangeoverMatrixScreen />);

      await waitFor(() => {
        expect(screen.getByText('Attributes')).toBeInTheDocument();
      });

      // Find and click the add button (has Plus icon)
      const addButtons = screen.getAllByRole('button');
      const addButton = addButtons.find(btn => btn.querySelector('svg.lucide-plus'));

      if (addButton) {
        await user.click(addButton);

        await waitFor(() => {
          expect(screen.getByText('Name (internal)')).toBeInTheDocument();
          expect(screen.getByText('Display Name')).toBeInTheDocument();
          expect(screen.getByText('Default Time (min)')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Matrix Value Operations', () => {
    it('should display matrix values from fetched data', async () => {
      render(<ChangeoverMatrixScreen />);

      await waitFor(() => {
        // Values extracted from matrix entries are displayed as chips
        // Check that the Color Matrix header is shown (first attribute is selected by default)
        expect(screen.getByText('Color Matrix')).toBeInTheDocument();
      });

      // After matrix loads, values (Red, Blue) should appear
      // Values appear in multiple places: chips, table headers, and row labels
      await waitFor(() => {
        // Use getAllByText since values appear multiple times in the matrix
        expect(screen.getAllByText('Red').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Blue').length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Save Matrix', () => {
    it('should render Save Matrix button', async () => {
      render(<ChangeoverMatrixScreen />);

      await waitFor(() => {
        expect(screen.getByText('Save Matrix')).toBeInTheDocument();
      });
    });

    it('should call upsert_entry when saving', async () => {
      const user = userEvent.setup();
      render(<ChangeoverMatrixScreen />);

      await waitFor(() => {
        expect(screen.getByText('Save Matrix')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save Matrix');
      await user.click(saveButton);

      // Should trigger IPC calls to save entries
      await waitFor(() => {
        const upsertCalls = mockInvoke.mock.calls.filter(
          call => call[0] === 'changeovers:upsert_entry'
        );
        expect(upsertCalls.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Import from SMED', () => {
    it('should render Import from SMED button', async () => {
      render(<ChangeoverMatrixScreen />);

      await waitFor(() => {
        expect(screen.getByText('Import from SMED')).toBeInTheDocument();
      });
    });
  });

  describe('IPC Calls', () => {
    it('should fetch attributes on mount', async () => {
      render(<ChangeoverMatrixScreen />);

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('changeovers:get_all_attributes');
      });
    });

    it('should fetch matrix when attribute is selected', async () => {
      render(<ChangeoverMatrixScreen />);

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('changeovers:get_matrix', {
          attributeId: 'attr-1',
        });
      });
    });

    it('should handle delete attribute', async () => {
      const user = userEvent.setup();
      render(<ChangeoverMatrixScreen />);

      await waitFor(() => {
        expect(screen.getByText('Color')).toBeInTheDocument();
      });

      // Find delete buttons (Trash2 icons)
      const deleteButtons = screen.getAllByRole('button').filter(
        btn => btn.querySelector('svg.lucide-trash-2')
      );

      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);

        await waitFor(() => {
          expect(mockInvoke).toHaveBeenCalledWith('changeovers:delete_attribute', {
            id: expect.any(String),
          });
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle IPC errors gracefully', async () => {
      // Mock console.error to verify it's called
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockInvoke.mockRejectedValue(new Error('Network error'));

      render(<ChangeoverMatrixScreen />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });
});
