import { useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useFileImport } from './useFileImport';

export function useKeyboardShortcuts() {
  const { currentScreen, navigateTo, setSaveTemplateDialogOpen } = useAppStore();
  const { importFile } = useFileImport();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + O: Import File
      if (isCmdOrCtrl && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        importFile();
      }

      // Cmd/Ctrl + S: Save Template (on Mapping or Config screen)
      if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        if (currentScreen === 'column-mapping' || currentScreen === 'changeover-config') {
          e.preventDefault();
          setSaveTemplateDialogOpen(true);
        }
      }

      // Cmd/Ctrl + ,: Settings
      if (isCmdOrCtrl && e.key === ',') {
        e.preventDefault();
        navigateTo('settings');
      }

      // Esc: Back to Welcome or close (simple implementation for now)
      if (e.key === 'Escape') {
        if (currentScreen !== 'welcome') {
          // If we are deep in the flow, maybe just go back one step?
          // For now, let's keep it simple: back to welcome or results back to config
          if (currentScreen === 'results' || currentScreen === 'export') {
            navigateTo('changeover-config');
          } else if (currentScreen === 'changeover-config') {
            navigateTo('column-mapping');
          } else if (currentScreen === 'column-mapping') {
            navigateTo('data-preview');
          } else {
            navigateTo('welcome');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen, navigateTo, importFile, setSaveTemplateDialogOpen]);
}

