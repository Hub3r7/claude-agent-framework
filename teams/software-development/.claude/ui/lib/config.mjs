// Central configuration — dynamic project root resolution
// Supports switching between projects at runtime.

import { resolve, join } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { EventEmitter } from 'node:events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const emitter = new EventEmitter();

/**
 * Walk up from a directory looking for CLAUDE.md to find project root.
 * Returns the directory or null if not found.
 */
function findProjectRoot(startDir) {
  let dir = resolve(startDir);
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, 'CLAUDE.md'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break; // filesystem root
    dir = parent;
  }
  return null;
}

/**
 * Resolve initial project root.
 * Priority: PROJECT_ROOT env → walk up from UI dir → cwd
 */
function resolveInitialRoot() {
  if (process.env.PROJECT_ROOT) {
    return resolve(process.env.PROJECT_ROOT);
  }
  // Walk up from .claude/ui/lib/ → look for CLAUDE.md
  const found = findProjectRoot(resolve(__dirname, '..', '..'));
  if (found) return found;
  return process.cwd();
}

// --- Mutable project state ---

let _projectRoot = resolveInitialRoot();

function derivePaths(root) {
  return {
    PROJECT_ROOT: root,
    NOTES_DIR: join(root, '.agentNotes'),
    STATE_DIR: join(root, '.claude', '.orchestra', 'state'),
    AGENTS_DIR: join(root, '.claude', 'agents'),
  };
}

let _paths = derivePaths(_projectRoot);

// --- Public API ---

/** Current project root */
export function getProjectRoot() { return _paths.PROJECT_ROOT; }
export function getNotesDir() { return _paths.NOTES_DIR; }
export function getStateDir() { return _paths.STATE_DIR; }
export function getAgentsDir() { return _paths.AGENTS_DIR; }

/**
 * Switch to a new project root.
 * Called when the terminal CWD changes to a directory with CLAUDE.md.
 * Returns true if project actually changed, false if same or not a project.
 */
export function switchProject(newCwd) {
  const newRoot = findProjectRoot(newCwd);
  if (!newRoot) return false;
  if (newRoot === _paths.PROJECT_ROOT) return false;

  _projectRoot = newRoot;
  _paths = derivePaths(newRoot);
  emitter.emit('project:changed', _paths);
  return true;
}

/**
 * Get current project info snapshot.
 */
export function getProjectInfo() {
  return {
    root: _paths.PROJECT_ROOT,
    name: _paths.PROJECT_ROOT.split('/').pop(),
    hasNotes: existsSync(_paths.NOTES_DIR),
    hasState: existsSync(_paths.STATE_DIR),
    hasAgents: existsSync(_paths.AGENTS_DIR),
  };
}

/** Subscribe to project changes */
export function onProjectChanged(handler) {
  emitter.on('project:changed', handler);
}

// --- Static exports for backward compatibility ---
// These re-evaluate on access via getter
export const PROJECT_ROOT = _paths.PROJECT_ROOT;
export const NOTES_DIR = _paths.NOTES_DIR;
export const STATE_DIR = _paths.STATE_DIR;
export const AGENTS_DIR = _paths.AGENTS_DIR;
