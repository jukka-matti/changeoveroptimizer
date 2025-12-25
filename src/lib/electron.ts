// Detect Electron environment
const isElectron = typeof window !== 'undefined' && (window as any).electron;

export async function invoke<T>(command: string, args?: any): Promise<T> {
  if (!isElectron) {
    console.warn(`[Electron Shim] Mocking invoke for: ${command}`, args);
    if (command === "read_file") return [] as any;
    if (command === "list_templates") return [] as any;
    return undefined as any;
  }
  return await (window as any).electron.invoke(command, args);
}

export interface FileFilter {
  name: string;
  extensions: string[];
}

export interface OpenDialogOptions {
  multiple?: boolean;
  filters?: FileFilter[];
}

export async function open(options: OpenDialogOptions): Promise<string | string[] | null> {
  if (!isElectron) {
    console.warn("[Electron Shim] Mocking dialog open", options);
    return null;
  }

  const result = await (window as any).electron.invoke('open_dialog', {
    filters: options.filters,
  });

  return result;
}

export interface SaveDialogOptions {
  defaultPath?: string;
  filters?: FileFilter[];
}

export async function save(options: SaveDialogOptions): Promise<string | null> {
  if (!isElectron) {
    console.warn("[Electron Shim] Mocking dialog save", options);
    return null;
  }

  const result = await (window as any).electron.invoke('save_dialog', {
    defaultPath: options.defaultPath,
    filters: options.filters,
  });

  return result;
}

export interface Settings {
  language: string;
  theme: string;
  telemetryEnabled: boolean;
}

/**
 * Open a file dialog and read the selected file.
 */
export async function openFileDialog(): Promise<{ path: string; data: Uint8Array } | null> {
  const selected = await open({
    multiple: false,
    filters: [
      {
        name: "Production Schedules",
        extensions: ["xlsx", "xls", "csv"],
      },
    ],
  });

  if (!selected || Array.isArray(selected)) {
    return null;
  }

  const data = await invoke<number[]>("read_file", { path: selected });
  return { path: selected, data: new Uint8Array(data) };
}

/**
 * Save data to a file via a save dialog.
 */
export async function saveFileDialog(
  filename: string,
  data: Uint8Array
): Promise<string | null> {
  const path = await save({
    defaultPath: filename,
    filters: [
      {
        name: "Excel Spreadsheet",
        extensions: ["xlsx"],
      },
      {
        name: "CSV File",
        extensions: ["csv"],
      },
      {
        name: "PDF Document",
        extensions: ["pdf"],
      },
    ],
  });

  if (!path) {
    return null;
  }

  await invoke("write_file", { path, data: Array.from(data) });
  return path;
}

/**
 * Example greet command call.
 */
export async function greet(name: string): Promise<string> {
  return await invoke("greet", { name });
}
