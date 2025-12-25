import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  invoke: (channel: string, ...args: any[]) => {
    // Whitelist channels
    const validChannels = [
      'greet',
      'read_file',
      'write_file',
      'list_templates',
      'save_template',
      'delete_template',
      'open_dialog',
      'save_dialog',
      // SMED channels
      'smed:get_all_studies',
      'smed:get_study_by_id',
      'smed:create_study',
      'smed:update_study',
      'smed:delete_study',
      'smed:get_steps',
      'smed:create_step',
      'smed:update_step',
      'smed:delete_step',
      'smed:get_improvements',
      'smed:create_improvement',
      'smed:update_improvement',
      'smed:get_standards',
      'smed:get_active_standard',
      'smed:create_standard',
      'smed:update_standard',
      'smed:publish_standard',
      'smed:deactivate_standard',
      'smed:get_logs',
      'smed:create_log',
      'smed:get_statistics',
      // Analytics channels - Optimization History
      'analytics:save_optimization_run',
      'analytics:get_optimization_runs',
      'analytics:get_optimization_run_by_id',
      'analytics:delete_optimization_run',
      'analytics:get_optimization_trends',
      'analytics:get_top_optimization_runs',
      'analytics:get_optimization_overview',
      // Analytics channels - SMED Analytics
      'analytics:get_smed_overview',
      'analytics:get_study_comparison',
      'analytics:get_improvement_trends',
      'analytics:get_improvement_types',
      'analytics:get_operation_breakdown',
      // Changeover Matrix channels
      'changeover:get_all_attributes',
      'changeover:get_active_attributes',
      'changeover:get_attribute_by_id',
      'changeover:upsert_attribute',
      'changeover:delete_attribute',
      'changeover:get_matrix',
      'changeover:upsert_entry',
      'changeover:delete_entry',
      'changeover:batch_lookup',
      'changeover:prefetch_matrix',
      'changeover:import_smed',
    ];

    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    throw new Error(`Invalid IPC channel: ${channel}`);
  },
});

// TypeScript global declaration for renderer
declare global {
  interface Window {
    electron: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}
