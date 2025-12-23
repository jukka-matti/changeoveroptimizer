import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import type { WindowState } from './types';

function getWindowStatePath(): string {
  return path.join(app.getPath('userData'), 'window-state.json');
}

export function loadWindowState(): WindowState | null {
  try {
    const filePath = getWindowStatePath();
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as WindowState;
  } catch {
    return null;
  }
}

export async function saveWindowState(state: WindowState): Promise<void> {
  const filePath = getWindowStatePath();
  const content = JSON.stringify(state, null, 2);
  const fs = await import('fs/promises');
  await fs.writeFile(filePath, content, 'utf-8');
}
