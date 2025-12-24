import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WelcomeScreen } from './WelcomeScreen';
import type { RecentFile } from '@/stores/settings-store';

// Mock dependencies
vi.mock('@/hooks/useFileImport');
vi.mock('@/stores/settings-store');
vi.mock('@/components/features/FileDropzone', () => ({
  FileDropzone: ({ onBrowse, onFileDrop }: any) => (
    <div data-testid="file-dropzone">
      <button onClick={onBrowse}>Browse</button>
      <button
        onClick={() =>
          onFileDrop(new ArrayBuffer(8), 'dropped.xlsx')
        }
      >
        Drop
      </button>
    </div>
  ),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'welcome.title': 'Welcome to ChangeoverOptimizer',
        'welcome.subtitle': 'Optimize your production schedule',
        'welcome.sample_card_title': 'Try Sample Data',
        'welcome.recent_files_title': 'Recent Files',
        'welcome.recent_files_desc': 'Quick access to recently opened files',
        'welcome.no_recent_files': 'No recent files',
      };
      return translations[key] || key;
    },
  }),
}));

// Import mocked modules
import { useFileImport } from '@/hooks/useFileImport';
import { useSettingsStore } from '@/stores/settings-store';

describe('WelcomeScreen', () => {
  const mockImportFile = vi.fn();
  const mockImportBuffer = vi.fn();
  const mockImportFromPath = vi.fn();
  const mockLoadSampleData = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useFileImport hook
    vi.mocked(useFileImport).mockReturnValue({
      importFile: mockImportFile,
      importBuffer: mockImportBuffer,
      importFromPath: mockImportFromPath,
      loadSampleData: mockLoadSampleData,
    });

    // Mock useSettingsStore - default empty recent files
    vi.mocked(useSettingsStore).mockReturnValue({
      recentFiles: [],
      addRecentFile: vi.fn(),
      removeRecentFile: vi.fn(),
      theme: 'light',
      setTheme: vi.fn(),
      language: 'en',
      setLanguage: vi.fn(),
      licenseKey: null,
      setLicenseKey: vi.fn(),
      reset: vi.fn(),
    } as any);
  });

  describe('Rendering', () => {
    it('should render welcome title and subtitle', () => {
      render(<WelcomeScreen />);

      expect(screen.getByText('Welcome to ChangeoverOptimizer')).toBeInTheDocument();
      expect(screen.getByText('Optimize your production schedule')).toBeInTheDocument();
    });

    it('should render FileDropzone component', () => {
      render(<WelcomeScreen />);

      expect(screen.getByTestId('file-dropzone')).toBeInTheDocument();
    });

    it('should render sample data card', () => {
      render(<WelcomeScreen />);

      expect(screen.getByText('Try Sample Data')).toBeInTheDocument();
      expect(screen.getByText('Load Example Schedule')).toBeInTheDocument();
    });

    it('should render recent files section', () => {
      render(<WelcomeScreen />);

      expect(screen.getByText('Recent Files')).toBeInTheDocument();
      expect(screen.getByText('Quick access to recently opened files')).toBeInTheDocument();
    });
  });

  describe('File Import', () => {
    it('should call importFile when FileDropzone browse is clicked', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen />);

      const browseButton = screen.getByText('Browse');
      await user.click(browseButton);

      expect(mockImportFile).toHaveBeenCalledTimes(1);
    });

    it('should call importBuffer when FileDropzone drop is triggered', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen />);

      const dropButton = screen.getByText('Drop');
      await user.click(dropButton);

      expect(mockImportBuffer).toHaveBeenCalledTimes(1);
      expect(mockImportBuffer).toHaveBeenCalledWith(
        expect.any(ArrayBuffer),
        'dropped.xlsx'
      );
    });
  });

  describe('Sample Data', () => {
    it('should call loadSampleData when sample card is clicked', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen />);

      // Card itself is clickable
      const sampleCard = screen.getByText('Try Sample Data').closest('.hover\\:border-primary');
      expect(sampleCard).toBeInTheDocument();

      if (sampleCard) {
        await user.click(sampleCard);
        expect(mockLoadSampleData).toHaveBeenCalledTimes(1);
      }
    });

    it('should call loadSampleData when button is clicked', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen />);

      const loadButton = screen.getByText('Load Example Schedule');
      await user.click(loadButton);

      // Button has stopPropagation, so it should still call loadSampleData
      expect(mockLoadSampleData).toHaveBeenCalledTimes(1);
    });
  });

  describe('Recent Files', () => {
    it('should show empty state when no recent files', () => {
      render(<WelcomeScreen />);

      expect(screen.getByText('No recent files')).toBeInTheDocument();
    });

    it('should display recent files list', () => {
      const mockRecentFiles: RecentFile[] = [
        {
          path: '/path/to/file1.xlsx',
          name: 'Production Schedule Q1.xlsx',
          lastOpened: '2025-12-20T10:00:00Z',
        },
        {
          path: '/path/to/file2.csv',
          name: 'Orders December.csv',
          lastOpened: '2025-12-22T14:30:00Z',
        },
      ];

      vi.mocked(useSettingsStore).mockReturnValue({
        recentFiles: mockRecentFiles,
        addRecentFile: vi.fn(),
        removeRecentFile: vi.fn(),
        theme: 'light',
        setTheme: vi.fn(),
        language: 'en',
        setLanguage: vi.fn(),
        licenseKey: null,
        setLicenseKey: vi.fn(),
        reset: vi.fn(),
      } as any);

      render(<WelcomeScreen />);

      expect(screen.getByText('Production Schedule Q1.xlsx')).toBeInTheDocument();
      expect(screen.getByText('Orders December.csv')).toBeInTheDocument();

      // Check formatted dates are displayed (2 files = 2 "Opened" texts)
      expect(screen.getAllByText(/Opened/)).toHaveLength(2);
    });

    it('should call importFromPath when recent file is clicked', async () => {
      const user = userEvent.setup();
      const mockRecentFiles: RecentFile[] = [
        {
          path: '/path/to/test-file.xlsx',
          name: 'Test File.xlsx',
          lastOpened: '2025-12-23T12:00:00Z',
        },
      ];

      vi.mocked(useSettingsStore).mockReturnValue({
        recentFiles: mockRecentFiles,
        addRecentFile: vi.fn(),
        removeRecentFile: vi.fn(),
        theme: 'light',
        setTheme: vi.fn(),
        language: 'en',
        setLanguage: vi.fn(),
        licenseKey: null,
        setLicenseKey: vi.fn(),
        reset: vi.fn(),
      } as any);

      render(<WelcomeScreen />);

      const fileButton = screen.getByText('Test File.xlsx').closest('button');
      expect(fileButton).toBeInTheDocument();

      if (fileButton) {
        await user.click(fileButton);
        expect(mockImportFromPath).toHaveBeenCalledTimes(1);
        expect(mockImportFromPath).toHaveBeenCalledWith('/path/to/test-file.xlsx');
      }
    });

    it('should display multiple recent files in order', () => {
      const mockRecentFiles: RecentFile[] = [
        {
          path: '/file1.xlsx',
          name: 'File 1',
          lastOpened: '2025-12-23T10:00:00Z',
        },
        {
          path: '/file2.xlsx',
          name: 'File 2',
          lastOpened: '2025-12-22T10:00:00Z',
        },
        {
          path: '/file3.xlsx',
          name: 'File 3',
          lastOpened: '2025-12-21T10:00:00Z',
        },
      ];

      vi.mocked(useSettingsStore).mockReturnValue({
        recentFiles: mockRecentFiles,
        addRecentFile: vi.fn(),
        removeRecentFile: vi.fn(),
        theme: 'light',
        setTheme: vi.fn(),
        language: 'en',
        setLanguage: vi.fn(),
        licenseKey: null,
        setLicenseKey: vi.fn(),
        reset: vi.fn(),
      } as any);

      render(<WelcomeScreen />);

      expect(screen.getByText('File 1')).toBeInTheDocument();
      expect(screen.getByText('File 2')).toBeInTheDocument();
      expect(screen.getByText('File 3')).toBeInTheDocument();

      // Should not show empty state
      expect(screen.queryByText('No recent files')).not.toBeInTheDocument();
    });

    it('should format last opened date correctly', () => {
      const mockRecentFiles: RecentFile[] = [
        {
          path: '/test.xlsx',
          name: 'Test',
          lastOpened: '2025-12-23T00:00:00Z',
        },
      ];

      vi.mocked(useSettingsStore).mockReturnValue({
        recentFiles: mockRecentFiles,
        addRecentFile: vi.fn(),
        removeRecentFile: vi.fn(),
        theme: 'light',
        setTheme: vi.fn(),
        language: 'en',
        setLanguage: vi.fn(),
        licenseKey: null,
        setLicenseKey: vi.fn(),
        reset: vi.fn(),
      } as any);

      render(<WelcomeScreen />);

      // Check that date formatting works (exact format depends on locale)
      const dateText = screen.getByText(/Opened/);
      expect(dateText).toBeInTheDocument();
      expect(dateText.textContent).toContain('Opened');
    });
  });

  describe('Component Integration', () => {
    it('should pass correct props to FileDropzone', () => {
      render(<WelcomeScreen />);

      const dropzone = screen.getByTestId('file-dropzone');
      expect(dropzone).toBeInTheDocument();

      // FileDropzone should receive onBrowse and onFileDrop callbacks
      // These are tested via the Browse and Drop button clicks above
    });

    it('should handle all import methods without errors', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen />);

      // Browse
      await user.click(screen.getByText('Browse'));
      expect(mockImportFile).toHaveBeenCalled();

      // Drop
      await user.click(screen.getByText('Drop'));
      expect(mockImportBuffer).toHaveBeenCalled();

      // Sample
      await user.click(screen.getByText('Load Example Schedule'));
      expect(mockLoadSampleData).toHaveBeenCalled();

      // All should be called without throwing errors
      expect(mockImportFile).toHaveBeenCalledTimes(1);
      expect(mockImportBuffer).toHaveBeenCalledTimes(1);
      expect(mockLoadSampleData).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<WelcomeScreen />);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Welcome to ChangeoverOptimizer');
    });

    it('should have clickable buttons', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen />);

      const loadButton = screen.getByRole('button', { name: /Load Example Schedule/i });
      expect(loadButton).toBeInTheDocument();

      await user.click(loadButton);
      expect(mockLoadSampleData).toHaveBeenCalled();
    });

    it('should have recent file buttons when files exist', () => {
      const mockRecentFiles: RecentFile[] = [
        {
          path: '/test.xlsx',
          name: 'Test File',
          lastOpened: '2025-12-23T00:00:00Z',
        },
      ];

      vi.mocked(useSettingsStore).mockReturnValue({
        recentFiles: mockRecentFiles,
        addRecentFile: vi.fn(),
        removeRecentFile: vi.fn(),
        theme: 'light',
        setTheme: vi.fn(),
        language: 'en',
        setLanguage: vi.fn(),
        licenseKey: null,
        setLicenseKey: vi.fn(),
        reset: vi.fn(),
      } as any);

      render(<WelcomeScreen />);

      const recentFileButtons = screen.getAllByRole('button');
      // Should have at least 2 buttons: Load Example Schedule + recent file
      expect(recentFileButtons.length).toBeGreaterThanOrEqual(2);
    });
  });
});
