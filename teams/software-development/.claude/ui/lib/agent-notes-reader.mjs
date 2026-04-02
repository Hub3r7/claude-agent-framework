import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { getNotesDir } from './config.mjs';

/**
 * Read notes for a specific agent.
 * @param {string} agent - agent name (e.g., 'architect', 'developer')
 * @returns {Promise<string|null>}
 */
export async function readAgentNotes(agent) {
  const filePath = join(getNotesDir(), agent, 'notes.md');
  try {
    return await readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * List all agents that have notes.
 * @returns {Promise<string[]>}
 */
export async function listAgentNotes() {
  if (!existsSync(getNotesDir())) return [];
  try {
    const entries = await readdir(getNotesDir(), { withFileTypes: true });
    const agents = [];
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const notesPath = join(getNotesDir(), entry.name, 'notes.md');
        if (existsSync(notesPath)) agents.push(entry.name);
      }
    }
    return agents;
  } catch {
    return [];
  }
}
