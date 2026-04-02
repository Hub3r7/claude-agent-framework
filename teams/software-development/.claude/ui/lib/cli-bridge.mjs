import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';

// OSC escape sequence for CWD reporting (same pattern as many terminal emulators)
// Format: \x1b]7;file://hostname/path\x07
const CWD_REPORT_PREFIX = '\x1b]7;file://';
const CWD_REPORT_RE = /\x1b\]7;file:\/\/[^/]*([^\x07]+)\x07/g;

async function importPty() {
  try {
    const mod = await import('node-pty');
    return mod.default || mod;
  } catch {
    return null;
  }
}

/**
 * CLI Bridge — spawns a shell PTY for terminal interaction.
 * Falls back to child_process.spawn if node-pty unavailable.
 * Emits 'cwd' events when the shell's working directory changes.
 */
export async function createCliBridge(options = {}) {
  const emitter = new EventEmitter();
  let pty = null;
  let childProc = null;
  let usePty = false;
  let currentCols = options.cols || 120;
  let currentRows = options.rows || 30;
  let lastCwd = null;

  const shell = options.shell || process.env.SHELL || '/bin/bash';
  const cwd = options.cwd || process.cwd();

  // PROMPT_COMMAND that reports CWD via OSC 7 escape sequence.
  // This is parsed from the terminal output stream to detect cd.
  const promptCommand = `__report_cwd() { printf '\\e]7;file://%s%s\\a' "$(hostname)" "$(pwd)"; }; PROMPT_COMMAND="__report_cwd;\${PROMPT_COMMAND}"`;

  function handleOutput(data) {
    const str = typeof data === 'string' ? data : data.toString();

    // Extract CWD from OSC 7 sequences before emitting
    let match;
    CWD_REPORT_RE.lastIndex = 0;
    while ((match = CWD_REPORT_RE.exec(str)) !== null) {
      const newCwd = decodeURIComponent(match[1]);
      if (newCwd !== lastCwd) {
        lastCwd = newCwd;
        emitter.emit('cwd', newCwd);
      }
    }

    // Strip OSC 7 sequences from output (terminal doesn't need to see them)
    const clean = str.replace(CWD_REPORT_RE, '');
    if (clean) emitter.emit('data', clean);
  }

  // Try node-pty first, fall back to child_process
  const nodePty = await importPty();
  if (nodePty) {
    try {
      pty = nodePty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: currentCols,
        rows: currentRows,
        cwd,
        env: { ...process.env, TERM: 'xterm-256color' },
      });
      usePty = true;

      pty.onData(handleOutput);

      pty.onExit(({ exitCode }) => {
        emitter.emit('exit', exitCode);
      });

      // Inject PROMPT_COMMAND after shell init
      setTimeout(() => { pty.write(promptCommand + '\n'); }, 300);
    } catch {
      usePty = false;
    }
  }

  if (!usePty) {
    childProc = spawn(shell, ['-i'], {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLUMNS: String(currentCols),
        LINES: String(currentRows),
      },
    });

    childProc.stdout.on('data', handleOutput);
    childProc.stderr.on('data', handleOutput);

    childProc.on('exit', (code) => {
      emitter.emit('exit', code);
    });

    // Inject PROMPT_COMMAND after shell init
    setTimeout(() => {
      if (childProc?.stdin?.writable) {
        childProc.stdin.write(promptCommand + '\n');
      }
    }, 300);
  }

  function write(data) {
    if (usePty && pty) {
      pty.write(data);
    } else if (childProc?.stdin?.writable) {
      childProc.stdin.write(data);
    }
  }

  function resize(newCols, newRows) {
    currentCols = newCols;
    currentRows = newRows;

    if (usePty && pty) {
      try { pty.resize(newCols, newRows); } catch {}
    } else if (childProc && !childProc.killed) {
      try {
        childProc.stdin.write(`stty cols ${newCols} rows ${newRows} 2>/dev/null\n`);
        childProc.kill('SIGWINCH');
      } catch {}
    }
  }

  function kill() {
    if (usePty && pty) {
      pty.kill();
    } else if (childProc) {
      childProc.kill();
    }
  }

  return {
    write,
    resize,
    kill,
    on: (event, handler) => emitter.on(event, handler),
    get isRunning() {
      if (usePty) return pty != null;
      return childProc != null && !childProc.killed;
    },
    get currentCwd() { return lastCwd; },
  };
}
