import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3170;
const PUBLIC_DIR = join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// --- HTTP Server ---

async function serveStatic(req, res) {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = join(PUBLIC_DIR, urlPath);

  // Prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw new Error('Not a file');

    const ext = extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = await readFile(filePath);

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
    });
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
}

async function handleApi(req, res, stateManager, cliBridge) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  res.setHeader('Content-Type', 'application/json');

  try {
    if (path === '/api/state' && req.method === 'GET') {
      const state = await stateManager.getFullState();
      res.writeHead(200);
      res.end(JSON.stringify(state));
      return;
    }

    if (path === '/api/task' && req.method === 'POST') {
      const body = await readBody(req);
      const result = await stateManager.createOrUpdateTask(JSON.parse(body));
      res.writeHead(200);
      res.end(JSON.stringify(result));
      return;
    }

    if (path === '/api/chain/start' && req.method === 'POST') {
      const body = await readBody(req);
      const result = await stateManager.startChain(JSON.parse(body));
      res.writeHead(200);
      res.end(JSON.stringify(result));
      return;
    }

    if (path === '/api/chain/verdict' && req.method === 'POST') {
      const body = await readBody(req);
      const result = await stateManager.recordVerdict(JSON.parse(body));
      res.writeHead(200);
      res.end(JSON.stringify(result));
      return;
    }

    if (path.startsWith('/api/notes') && req.method === 'GET') {
      const agent = path.split('/api/notes/')[1];
      const { readAgentNotes, listAgentNotes } = await import('./lib/agent-notes-reader.mjs');
      if (agent) {
        const notes = await readAgentNotes(agent);
        res.writeHead(200);
        res.end(JSON.stringify({ agent, notes }));
      } else {
        const list = await listAgentNotes();
        res.writeHead(200);
        res.end(JSON.stringify({ agents: list }));
      }
      return;
    }

    if (path === '/api/verify/run' && req.method === 'POST') {
      const { runVerificationGate } = await import('./lib/verification-gate.mjs');
      const { getProjectRoot, getStateDir } = await import('./lib/config.mjs');
      const result = runVerificationGate({ cwd: getProjectRoot() });
      // Persist to verification state using atomic write
      try {
        const { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync } = await import('node:fs');
        const { join } = await import('node:path');
        const stateDir = getStateDir();
        if (!existsSync(stateDir)) mkdirSync(stateDir, { recursive: true });
        const vPath = join(stateDir, 'verification.json');
        let verification = { version: 1, gates: [] };
        try { verification = JSON.parse(readFileSync(vPath, 'utf-8')); } catch {}
        verification.gates.push(result);
        const tmp = vPath + '.tmp.' + process.pid;
        writeFileSync(tmp, JSON.stringify(verification, null, 2));
        renameSync(tmp, vPath);
      } catch {}
      res.writeHead(200);
      res.end(JSON.stringify({ result }));
      return;
    }

    if (path === '/api/terminal/input' && req.method === 'POST') {
      const body = await readBody(req);
      const { data } = JSON.parse(body);
      if (cliBridge) cliBridge.write(data);
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (path === '/api/terminal/resize' && req.method === 'POST') {
      const body = await readBody(req);
      const { cols, rows } = JSON.parse(body);
      if (cliBridge) cliBridge.resize(cols, rows);
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (err) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

// --- Main ---

async function main() {
  // Lazy imports — modules may not exist yet during incremental development
  let stateManager = null;
  let cliBridge = null;

  try {
    const sm = await import('./lib/state-manager.mjs');
    stateManager = sm.createStateManager();
  } catch {
    console.log('[hub] state-manager not available yet, API endpoints will return errors');
  }

  try {
    const cb = await import('./lib/cli-bridge.mjs');
    cliBridge = await cb.createCliBridge();
  } catch (err) {
    console.log('[hub] cli-bridge not available yet, terminal will be inactive');
  }

  // Log resolved project root
  try {
    const { getProjectRoot, getNotesDir, getStateDir } = await import('./lib/config.mjs');
    console.log(`  [project] ${getProjectRoot()}`);
    console.log(`  [notes]   ${getNotesDir()}`);
    console.log(`  [state]   ${getStateDir()}`);
  } catch {}

  const server = createServer(async (req, res) => {
    if (req.url.startsWith('/api/')) {
      await handleApi(req, res, stateManager, cliBridge);
    } else {
      await serveStatic(req, res);
    }
  });

  // --- WebSocket ---

  const wss = new WebSocketServer({ server });
  const clients = new Set();

  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
    ws.on('error', () => clients.delete(ws));

    // Send current state on connect
    if (stateManager) {
      stateManager.getFullState().then(state => {
        ws.send(JSON.stringify({ type: 'state:update', payload: state, timestamp: new Date().toISOString() }));
      });
    }

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw);

        if (msg.type === 'terminal:input' && cliBridge) {
          cliBridge.write(msg.payload.data);
        }

        if (msg.type === 'terminal:resize' && cliBridge) {
          cliBridge.resize(msg.payload.cols, msg.payload.rows);
        }

        if (msg.type === 'chain:start' && stateManager) {
          const result = await stateManager.startChain(msg.payload);
          broadcast({ type: 'state:update', payload: await stateManager.getFullState() });
        }
      } catch (err) {
        console.error('[ws] message error:', err.message);
      }
    });
  });

  function broadcast(msg) {
    const data = JSON.stringify({ ...msg, timestamp: new Date().toISOString() });
    for (const ws of clients) {
      if (ws.readyState === 1) ws.send(data);
    }
  }

  // Wire up state changes → broadcast
  if (stateManager) {
    stateManager.on('change', async () => {
      const state = await stateManager.getFullState();
      broadcast({ type: 'state:update', payload: state });
    });
  }

  // Wire up terminal output → broadcast
  if (cliBridge) {
    cliBridge.on('data', (data) => {
      broadcast({ type: 'terminal:output', payload: { data } });
    });

    // Wire up CWD changes → project switching
    cliBridge.on('cwd', async (newCwd) => {
      try {
        const { switchProject, getProjectInfo } = await import('./lib/config.mjs');
        const changed = switchProject(newCwd);
        if (changed) {
          const info = getProjectInfo();
          console.log(`  [project switch] ${info.root}`);
          // Reinitialize state manager for new project
          try {
            const sm = await import('./lib/state-manager.mjs');
            stateManager = sm.createStateManager();
            stateManager.on('change', async () => {
              const state = await stateManager.getFullState();
              broadcast({ type: 'state:update', payload: state });
            });
          } catch {}
          // Broadcast project change + fresh state
          broadcast({ type: 'project:changed', payload: info });
          if (stateManager) {
            const state = await stateManager.getFullState();
            broadcast({ type: 'state:update', payload: state });
          }
        }
      } catch (err) {
        console.error('[cwd] project switch error:', err.message);
      }
    });
  }

  server.listen(PORT, () => {
    console.log(`\n  \x1b[32m╔══════════════════════════════════════╗\x1b[0m`);
    console.log(`  \x1b[32m║\x1b[0m  CLAUDE CODE CONTROL HUB \x1b[32mv0.1\x1b[0m      \x1b[32m║\x1b[0m`);
    console.log(`  \x1b[32m║\x1b[0m  http://localhost:${PORT}              \x1b[32m║\x1b[0m`);
    console.log(`  \x1b[32m╚══════════════════════════════════════╝\x1b[0m\n`);
  });
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
