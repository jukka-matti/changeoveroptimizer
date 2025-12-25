import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import {
  handleReadFile,
  handleWriteFile,
  handleListTemplates,
  handleSaveTemplate,
  handleDeleteTemplate,
  handleGreet,
  handleOpenDialog,
  handleSaveDialog,
  // SMED handlers
  handleGetAllStudies,
  handleGetStudyById,
  handleCreateStudy,
  handleUpdateStudy,
  handleDeleteStudy,
  handleGetStepsByStudyId,
  handleCreateStep,
  handleUpdateStep,
  handleDeleteStep,
  handleGetImprovementsByStudyId,
  handleCreateImprovement,
  handleUpdateImprovement,
  handleGetStandardsByStudyId,
  handleGetActiveStandard,
  handleCreateStandard,
  handleUpdateStandard,
  handlePublishStandard,
  handleDeactivateStandard,
  handleGetLogsByStudyId,
  handleCreateChangeoverLog,
  handleGetStudyStatistics,
  // Analytics handlers
  handleSaveOptimizationRun,
  handleGetOptimizationRuns,
  handleGetOptimizationRunById,
  handleDeleteOptimizationRun,
  handleGetOptimizationSavingsTrend,
  handleGetTopOptimizationRuns,
  handleGetOptimizationOverviewStats,
  handleGetSmedOverviewStats,
  handleGetStudyComparisonData,
  handleGetImprovementTrends,
  handleGetImprovementTypeDistribution,
  handleGetOperationTypeBreakdown,
} from './ipc-handlers';
import { loadWindowState, saveWindowState } from './window-state';
import { initDatabase, closeDatabase } from './db';

let mainWindow: BrowserWindow | null = null;

// CSP header
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.paddle.com https://changeoveroptimizer.com";

// Vite dev server URL (injected by Electron Forge)
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

function createWindow(): void {
  // Load saved window state or use defaults
  const windowState = loadWindowState() || {
    width: 1200,
    height: 800,
    x: undefined,
    y: undefined,
    maximized: false,
  };

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 800,
    minHeight: 600,
    title: 'ChangeoverOptimizer',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Maximize if needed
  if (windowState.maximized) {
    mainWindow.maximize();
  }

  // Load the app
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Set CSP header
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [CSP],
        },
      });
    }
  );

  // Save window state on resize/move
  const saveState = () => {
    if (!mainWindow) return;
    const bounds = mainWindow.getBounds();
    saveWindowState({
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      maximized: mainWindow.isMaximized(),
    });
  };

  let saveTimeout: NodeJS.Timeout | null = null;
  mainWindow.on('resize', () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveState, 500);
  });

  mainWindow.on('move', () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveState, 500);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  // Initialize database FIRST
  try {
    initDatabase();
    console.log('[Main] Database initialized');
  } catch (error) {
    console.error('[Main] Failed to initialize database:', error);
    app.quit();
    return;
  }

  // Register IPC handlers
  ipcMain.handle('greet', handleGreet);
  ipcMain.handle('read_file', handleReadFile);
  ipcMain.handle('write_file', handleWriteFile);
  ipcMain.handle('list_templates', handleListTemplates);
  ipcMain.handle('save_template', handleSaveTemplate);
  ipcMain.handle('delete_template', handleDeleteTemplate);
  ipcMain.handle('open_dialog', handleOpenDialog);
  ipcMain.handle('save_dialog', handleSaveDialog);

  // SMED IPC handlers
  ipcMain.handle('smed:get_all_studies', handleGetAllStudies);
  ipcMain.handle('smed:get_study_by_id', handleGetStudyById);
  ipcMain.handle('smed:create_study', handleCreateStudy);
  ipcMain.handle('smed:update_study', handleUpdateStudy);
  ipcMain.handle('smed:delete_study', handleDeleteStudy);
  ipcMain.handle('smed:get_steps', handleGetStepsByStudyId);
  ipcMain.handle('smed:create_step', handleCreateStep);
  ipcMain.handle('smed:update_step', handleUpdateStep);
  ipcMain.handle('smed:delete_step', handleDeleteStep);
  ipcMain.handle('smed:get_improvements', handleGetImprovementsByStudyId);
  ipcMain.handle('smed:create_improvement', handleCreateImprovement);
  ipcMain.handle('smed:update_improvement', handleUpdateImprovement);
  ipcMain.handle('smed:get_standards', handleGetStandardsByStudyId);
  ipcMain.handle('smed:get_active_standard', handleGetActiveStandard);
  ipcMain.handle('smed:create_standard', handleCreateStandard);
  ipcMain.handle('smed:update_standard', handleUpdateStandard);
  ipcMain.handle('smed:publish_standard', handlePublishStandard);
  ipcMain.handle('smed:deactivate_standard', handleDeactivateStandard);
  ipcMain.handle('smed:get_logs', handleGetLogsByStudyId);
  ipcMain.handle('smed:create_log', handleCreateChangeoverLog);
  ipcMain.handle('smed:get_statistics', handleGetStudyStatistics);

  // Analytics IPC handlers - Optimization History
  ipcMain.handle('analytics:save_optimization_run', handleSaveOptimizationRun);
  ipcMain.handle('analytics:get_optimization_runs', handleGetOptimizationRuns);
  ipcMain.handle('analytics:get_optimization_run_by_id', handleGetOptimizationRunById);
  ipcMain.handle('analytics:delete_optimization_run', handleDeleteOptimizationRun);
  ipcMain.handle('analytics:get_optimization_trends', handleGetOptimizationSavingsTrend);
  ipcMain.handle('analytics:get_top_optimization_runs', handleGetTopOptimizationRuns);
  ipcMain.handle('analytics:get_optimization_overview', handleGetOptimizationOverviewStats);

  // Analytics IPC handlers - SMED Analytics
  ipcMain.handle('analytics:get_smed_overview', handleGetSmedOverviewStats);
  ipcMain.handle('analytics:get_study_comparison', handleGetStudyComparisonData);
  ipcMain.handle('analytics:get_improvement_trends', handleGetImprovementTrends);
  ipcMain.handle('analytics:get_improvement_types', handleGetImprovementTypeDistribution);
  ipcMain.handle('analytics:get_operation_breakdown', handleGetOperationTypeBreakdown);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeDatabase();
    app.quit();
  }
});

// Cleanup database on app quit
app.on('before-quit', () => {
  closeDatabase();
});
