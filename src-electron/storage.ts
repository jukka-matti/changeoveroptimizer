import { app } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import type { StoredTemplate } from './types';

export function getStorageDir(): string {
  return app.getPath('userData');
}

export function getTemplatesDir(): string {
  return path.join(getStorageDir(), 'templates');
}

export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

export async function listTemplates(): Promise<StoredTemplate[]> {
  const dir = getTemplatesDir();
  await ensureDir(dir);

  const templates: StoredTemplate[] = [];
  const entries = await fs.readdir(dir);

  for (const entry of entries) {
    if (entry.endsWith('.json')) {
      const filePath = path.join(dir, entry);
      const content = await fs.readFile(filePath, 'utf-8');
      try {
        const template = JSON.parse(content) as StoredTemplate;
        templates.push(template);
      } catch (err) {
        console.error(`Failed to parse template ${entry}:`, err);
      }
    }
  }

  // Sort by modified date (descending)
  templates.sort((a, b) => b.modified.localeCompare(a.modified));
  return templates;
}

export async function saveTemplate(template: StoredTemplate): Promise<void> {
  const dir = getTemplatesDir();
  await ensureDir(dir);

  const filePath = path.join(dir, `${template.id}.json`);
  const content = JSON.stringify(template, null, 2);
  await fs.writeFile(filePath, content, 'utf-8');
}

export async function deleteTemplate(id: string): Promise<void> {
  const dir = getTemplatesDir();
  const filePath = path.join(dir, `${id}.json`);

  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
  } catch (err) {
    // File doesn't exist, ignore
  }
}
