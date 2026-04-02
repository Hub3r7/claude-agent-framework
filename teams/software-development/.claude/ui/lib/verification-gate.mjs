import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Shell injection pattern (from GSD verification-gate.ts)
const SHELL_INJECTION_PATTERN = /[;|`]|\$\(/;

const KNOWN_PREFIXES = new Set([
  'npm', 'npx', 'yarn', 'pnpm', 'node', 'tsc', 'eslint',
  'jest', 'vitest', 'pytest', 'go', 'cargo', 'make',
]);

/**
 * Sanitize a verification command.
 * @param {string} cmd
 * @returns {string|null} - sanitized command or null if unsafe
 */
function sanitizeCommand(cmd) {
  if (SHELL_INJECTION_PATTERN.test(cmd)) return null;
  const firstWord = cmd.trim().split(/\s+/)[0];
  if (!KNOWN_PREFIXES.has(firstWord)) return null;
  return cmd.trim();
}

/**
 * Discover verification commands.
 * Priority: preference → task plan → package.json (from GSD verification-gate.ts)
 */
export function discoverCommands(options = {}) {
  // 1. Explicit preference
  if (options.preferenceCommands?.length > 0) {
    const filtered = options.preferenceCommands
      .map(c => sanitizeCommand(c))
      .filter(Boolean);
    if (filtered.length > 0) return { commands: filtered, source: 'preference' };
  }

  // 2. Task plan verify field
  if (options.taskPlanVerify?.trim()) {
    const commands = options.taskPlanVerify
      .split('&&')
      .map(c => c.trim())
      .map(c => sanitizeCommand(c))
      .filter(Boolean);
    if (commands.length > 0) return { commands, source: 'task-plan' };
  }

  // 3. package.json scripts
  const pkgPath = join(options.cwd || process.cwd(), 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      const commands = [];
      for (const key of ['typecheck', 'lint', 'test']) {
        if (typeof pkg.scripts?.[key] === 'string') {
          commands.push(`npm run ${key}`);
        }
      }
      if (commands.length > 0) return { commands, source: 'package-json' };
    } catch {}
  }

  return { commands: [], source: 'none' };
}

/**
 * Run verification gate.
 * Executes each command and returns structured result (from GSD pattern).
 */
export function runVerificationGate(options = {}) {
  const { commands, source } = discoverCommands(options);
  const timeout = options.commandTimeoutMs ?? 120_000;

  const checks = [];
  for (const command of commands) {
    const start = Date.now();
    const result = spawnSync('sh', ['-c', command], {
      cwd: options.cwd || process.cwd(),
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout,
    });

    checks.push({
      command,
      exitCode: result.status ?? 1,
      stdout: (result.stdout || '').slice(0, 10000),
      stderr: (result.stderr || '').slice(0, 10000),
      durationMs: Date.now() - start,
    });
  }

  return {
    passed: checks.length > 0 && checks.every(c => c.exitCode === 0),
    checks,
    discoverySource: source,
    timestamp: Date.now(),
  };
}

/**
 * 5-step verification protocol status tracker (from Superpowers).
 * IDENTIFY → RUN → READ → VERIFY → CLAIM
 */
export function createVerificationTracker() {
  return {
    steps: {
      identify: { status: 'pending', data: null },
      run: { status: 'pending', data: null },
      read: { status: 'pending', data: null },
      verify: { status: 'pending', data: null },
      claim: { status: 'pending', data: null },
    },
    advance(step, data) {
      if (this.steps[step]) {
        this.steps[step] = { status: 'done', data };
      }
    },
    isComplete() {
      return Object.values(this.steps).every(s => s.status === 'done');
    },
  };
}
