import { WsClient } from './lib/ws-client.mjs';
import { $, $$, el, formatTokens, formatCost, formatDuration } from './lib/dom-utils.mjs';

// --- State ---

let state = {
  workflow: null,
  task: null,
  verdicts: [],
  ledger: null,
  stuckDetection: null,
};

// --- WebSocket ---

const wsUrl = `ws://${location.host}`;
const ws = new WsClient(wsUrl);

ws.on('connection', ({ connected }) => {
  const indicator = $('#ws-indicator');
  indicator.classList.toggle('connected', connected);
  if (connected) updateStatus('connected');
  else updateStatus('disconnected');
});

ws.on('state:update', (payload) => {
  if (payload) {
    state = { ...state, ...payload };
    renderAll();
  }
});

ws.on('terminal:output', ({ data }) => {
  if (term) term.write(data);
});

ws.on('chain:progress', (payload) => {
  // Merged into state:update
});

ws.on('stuck:warning', ({ reason }) => {
  showStuckBanner(reason);
});

ws.on('project:changed', (info) => {
  updateStatus(`project switched: ${info.name}`);
  // Reset local state for new project
  state = {
    workflow: null,
    task: null,
    verdicts: [],
    ledger: null,
    stuckDetection: null,
    project: info,
  };
  renderAll();
});

// --- ASCII Header ---

function renderHeader() {
  const logo = $('#header-logo');
  logo.textContent =
    '╔═╗╦  ╔═╗╦ ╦╔╦╗╔═╗  ╔═╗╔═╗╔╦╗╔═╗\n' +
    '║  ║  ╠═╣║ ║ ║║║╣   ║  ║ ║ ║║║╣  \n' +
    '╚═╝╩═╝╩ ╩╚═╝═╩╝╚═╝  ╚═╝╚═╝═╩╝╚═╝ CONTROL HUB';
}

// --- Terminal (xterm.js) ---

let term = null;
let fitAddon = null;

function initTerminal() {
  const container = $('#terminal-container');
  if (!container || typeof Terminal === 'undefined') return;

  term = new Terminal({
    theme: {
      background: '#000000',
      foreground: '#00ff00',
      cursor: '#00ff00',
      cursorAccent: '#000000',
      selectionBackground: 'rgba(0, 255, 0, 0.3)',
      black: '#000000',
      red: '#ff3333',
      green: '#00ff00',
      yellow: '#ffaa00',
      blue: '#00ccff',
      magenta: '#cc00ff',
      cyan: '#00ccff',
      white: '#cccccc',
      brightBlack: '#008800',
      brightRed: '#ff6666',
      brightGreen: '#33ff33',
      brightYellow: '#ffcc33',
      brightBlue: '#33ddff',
      brightMagenta: '#dd33ff',
      brightCyan: '#33ffff',
      brightWhite: '#ffffff',
    },
    fontFamily: "'IBM Plex Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontSize: 13,
    cursorBlink: true,
    cursorStyle: 'block',
    scrollback: 5000,
  });

  if (typeof FitAddon !== 'undefined') {
    fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
  }

  term.open(container);

  term.onData((data) => {
    ws.send('terminal:input', { data });
  });

  // Settle layout then show welcome (inspired by GSD's 12-retry pattern)
  settleTerminalLayout().then(() => {
    term.writeln('\x1b[32m╔═══════════════════════════════════════════════╗\x1b[0m');
    term.writeln('\x1b[32m║\x1b[0m  CLAUDE CODE CONTROL HUB — Terminal Ready     \x1b[32m║\x1b[0m');
    term.writeln('\x1b[32m║\x1b[0m  Type commands or start a chain from UI        \x1b[32m║\x1b[0m');
    term.writeln('\x1b[32m╚═══════════════════════════════════════════════╝\x1b[0m');
    term.writeln('');
  });

  // ResizeObserver for container size changes (more reliable than window resize)
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => {
      if (fitAddon) {
        try { fitAddon.fit(); } catch {}
      }
    });
    ro.observe(container);
  }

  window.addEventListener('resize', () => {
    if (fitAddon) {
      try { fitAddon.fit(); } catch {}
    }
  });
}

async function settleTerminalLayout() {
  if (!fitAddon) return;
  // Wait for fonts, then retry fit (adapted from GSD shell-terminal.tsx)
  if ('fonts' in document) {
    await Promise.race([
      document.fonts.ready,
      new Promise(r => setTimeout(r, 1000)),
    ]);
  }
  const container = $('#terminal-container');
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise(r => requestAnimationFrame(r));
    try { fitAddon.fit(); } catch {}
    // Check container has real dimensions and terminal has reasonable size
    if (container && container.offsetWidth > 100 && container.offsetHeight > 80) {
      if (term && term.cols > 10 && term.rows > 4) {
        // Send resize to server so PTY matches
        ws.send('terminal:resize', { cols: term.cols, rows: term.rows });
        return;
      }
    }
    await new Promise(r => setTimeout(r, 80));
  }
  // Final attempt
  try { fitAddon.fit(); } catch {}
}

// --- Tabs ---

function initTabs() {
  for (const tab of $$('.tab')) {
    tab.addEventListener('click', () => {
      const panel = tab.closest('.panel');
      for (const t of $$('.tab', panel)) t.classList.remove('active');
      for (const c of $$('.tab-content', panel)) c.classList.remove('active');
      tab.classList.add('active');
      const content = $(`#tab-${tab.dataset.tab}`, panel) || $(`#tab-${tab.dataset.tab}`);
      if (content) content.classList.add('active');
    });
  }
}

// --- Render Functions ---

function renderAll() {
  renderHeaderInfo();
  renderChainBar();
  renderCostTable();
  renderHistory();
  renderTaskInfo();
  renderWorkflow();
  renderStuck();
  renderChecksPanel();
  renderStatusBar();
}

function renderHeaderInfo() {
  const w = state.workflow;
  $('#header-project').textContent = state.project?.name || '—';
  $('#header-tier').textContent = w?.tier != null ? `${w.tier}` : '—';
  $('#header-agent').textContent = w?.activeAgent || '—';
}

function renderChainBar() {
  const bar = $('#chain-bar');
  const w = state.workflow;
  if (!w || !w.chain || w.chain.length === 0) {
    bar.innerHTML = '<span class="chain-label">CHAIN</span><span class="text-dim">no active chain</span>';
    return;
  }

  const completed = w.phase === 'completed';
  let html = `<span class="chain-label">CHAIN</span>`;
  if (completed) html += `<span class="chain-phase-done">done</span>`;
  w.chain.forEach((agent, i) => {
    if (i > 0) html += '<span class="chain-arrow">→</span>';
    let cls = 'pending';
    if (i < w.chainIndex) cls = 'done';
    else if (i === w.chainIndex && !completed) cls = 'active';
    // Check for fail
    const verdict = (state.verdicts || []).find(v => v.agent === agent && v.chainStep === i);
    if (verdict && verdict.verdict === 'FAIL') cls = 'fail';
    html += `<span class="chain-agent ${cls}">${agent}</span>`;
  });
  bar.innerHTML = html;
}

function renderCostTable() {
  const body = $('#cost-body');
  const ledger = state.ledger;
  if (!ledger || !ledger.chains || ledger.chains.length === 0) {
    body.innerHTML = '<tr><td colspan="6" class="text-dim">no data yet</td></tr>';
    return;
  }

  const currentChain = ledger.chains[ledger.chains.length - 1];
  let html = '';
  for (const entry of currentChain.entries) {
    const vCls = entry.verdict === 'PASS' ? 'verdict-pass' : entry.verdict === 'FAIL' ? 'verdict-fail' : 'text-dim';
    html += `<tr>
      <td class="text-cyan">${entry.agent}</td>
      <td class="text-dim">${entry.model || '—'}</td>
      <td class="number">${formatTokens(entry.tokens)}</td>
      <td class="number text-dim">${formatDuration(entry.durationMs)}</td>
      <td class="number">${formatCost(entry.estimatedCostEur)}</td>
      <td class="${vCls}">${entry.verdict || '—'}</td>
    </tr>`;
  }
  if (currentChain.totals) {
    html += `<tr class="total-row">
      <td>CHAIN TOTAL</td>
      <td></td>
      <td class="number">${formatTokens(currentChain.totals.tokens)}</td>
      <td class="number text-dim">${formatDuration(currentChain.totals.durationMs)}</td>
      <td class="number">${formatCost(currentChain.totals.estimatedCostEur)}</td>
      <td></td>
    </tr>`;
  }
  const pt = state.projectTotals;
  if (pt && ledger.chains.length > 1) {
    html += `<tr class="total-row project-total-row">
      <td class="text-amber">PROJECT TOTAL</td>
      <td class="text-dim">${ledger.chains.length} chains</td>
      <td class="number text-amber">${formatTokens(pt.tokens)}</td>
      <td class="number text-dim">${formatDuration(pt.durationMs)}</td>
      <td class="number text-amber">${formatCost(pt.estimatedCostEur)}</td>
      <td></td>
    </tr>`;
  }
  body.innerHTML = html;
}

function renderHistory() {
  const el = $('#history-list');
  const chains = state.ledger?.chains;
  if (!chains || chains.length === 0) {
    el.innerHTML = '<span class="text-dim">no history yet</span>';
    return;
  }

  // Most recent first, skip current (last) chain if still running
  const list = [...chains].reverse();
  let html = '';
  for (const chain of list) {
    const date = chain.startedAt ? new Date(chain.startedAt).toLocaleString('cs-CZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
    const agents = (chain.entries || []).map(e => {
      const cls = e.verdict === 'PASS' ? 'verdict-pass' : e.verdict === 'FAIL' ? 'verdict-fail' : 'text-dim';
      return `<span class="${cls}">${e.agent}</span>`;
    }).join('<span class="text-dim"> → </span>');
    const status = chain.completedAt ? 'done' : 'running';
    const statusCls = chain.completedAt ? 'text-dim' : 'text-cyan';
    const summary = chain.taskSummary ? `<div class="history-summary">${chain.taskSummary}</div>` : '';
    html += `<div class="history-entry">
      <div class="history-meta">
        <span class="text-dim">${date}</span>
        <span class="history-tier text-dim">T${chain.tier ?? '?'}</span>
        <span class="${statusCls}">${status}</span>
        <span class="number">${formatCost(chain.totals?.estimatedCostEur)}</span>
      </div>
      ${summary}
      <div class="history-chain">${agents || '<span class="text-dim">—</span>'}</div>
    </div>`;
  }
  el.innerHTML = html;
}

function renderTaskInfo() {
  const t = state.task;
  $('#task-id').textContent = t?.id || '—';
  $('#task-summary').textContent = t?.summary || '—';
  $('#task-tier').textContent = t?.tier != null ? `Tier ${t.tier}` : '—';
  $('#task-phase').textContent = state.workflow?.phase || '—';
}

function renderWorkflow() {
  const w = state.workflow;
  const modeLabel = w?.mode === 'A' ? 'A (design review)' : w?.mode === 'B' ? 'B (code review)' : w?.phase || '—';
  $('#wf-mode').textContent = modeLabel;
  $('#wf-chain').textContent = w?.chain?.join(' → ') || '—';
  $('#wf-index').textContent = w?.chainIndex != null ? `${w.chainIndex}/${w.chain?.length || 0}` : '—';

  const stuck = state.stuckDetection;
  $('#wf-stuck').textContent = stuck?.detected ? stuck.reason : 'none';
  $('#wf-stuck').className = stuck?.detected ? 'text-amber' : '';
  $('#wf-fixes').textContent = stuck?.fixAttempts || '0';
}

function renderStuck() {
  const banner = $('#stuck-banner');
  const stuck = state.stuckDetection;
  if (stuck?.detected) {
    banner.classList.add('visible');
    $('#stuck-reason').textContent = stuck.reason;
  } else {
    banner.classList.remove('visible');
  }
}

function renderChecksPanel() {
  const v = state.verification;
  const stuck = state.stuckDetection;

  // Show last verification gate result if available
  const lastGate = v?.gates?.[v.gates.length - 1];
  if (lastGate) {
    $('#verify-source').textContent = lastGate.discoverySource || '—';
    const cmds = lastGate.checks?.map(c => c.command).join(', ') || '—';
    $('#verify-commands').textContent = cmds;
    const passed = lastGate.passed;
    const resultEl = $('#verify-result');
    resultEl.textContent = passed ? 'PASSED' : 'FAILED';
    resultEl.className = passed ? 'verdict-pass' : 'verdict-fail';

    let checksHtml = '';
    for (const check of (lastGate.checks || [])) {
      const cls = check.exitCode === 0 ? 'text-green' : 'text-red';
      checksHtml += `<div class="${cls}">${check.command} → exit ${check.exitCode} (${check.durationMs}ms)</div>`;
    }
    $('#verify-checks').innerHTML = checksHtml || '—';
  }

  // Escalation monitor
  const fixes = stuck?.fixAttempts || 0;
  $('#verify-fixes').textContent = fixes;
  $('#verify-fixes').className = fixes >= 3 ? 'text-amber' : '';

  const escalationEl = $('#verify-escalation');
  if (fixes >= 3) {
    escalationEl.classList.remove('hidden');
  } else {
    escalationEl.classList.add('hidden');
  }
}

function renderStatusBar() {
  const w = state.workflow;
  const ledger = state.ledger;
  const currentChain = ledger?.chains?.[ledger.chains.length - 1];

  if (w?.activeAgent) {
    updateStatus(`${w.activeAgent} ${w.phase || 'running'}`);
  }

  $('#status-tokens').textContent = formatTokens(currentChain?.totals?.tokens || 0);
  $('#status-cost').textContent = formatCost(currentChain?.totals?.estimatedCostEur || 0);
}

function updateStatus(text) {
  $('#status-text').textContent = text;
}

function showStuckBanner(reason) {
  const banner = $('#stuck-banner');
  banner.classList.add('visible');
  $('#stuck-reason').textContent = reason;
}

// --- Actions ---

function initActions() {
  $('#btn-new-task').addEventListener('click', () => {
    const summary = prompt('Task description:');
    if (!summary) return;
    const tier = prompt('Tier (0-4, leave empty for auto):');
    fetch('/api/task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary, tier: tier ? parseInt(tier) : null }),
    });
  });

  $('#btn-start-chain').addEventListener('click', () => {
    const t = state.task;
    if (!t?.id) {
      alert('Create a task first');
      return;
    }
    ws.send('chain:start', { taskId: t.id, tier: t.tier });
  });

  // Run verification
  const btnVerify = $('#btn-run-verify');
  if (btnVerify) {
    btnVerify.addEventListener('click', async () => {
      btnVerify.textContent = 'Running...';
      btnVerify.disabled = true;
      try {
        const res = await fetch('/api/verify/run', { method: 'POST' });
        const data = await res.json();
        if (data.result) {
          renderChecksPanel();
        }
      } catch {
        // Will update on next state refresh
      } finally {
        btnVerify.textContent = 'Run Verification';
        btnVerify.disabled = false;
      }
    });
  }

  // Notes viewer
  $('#notes-agent-select').addEventListener('change', async (e) => {
    const agent = e.target.value;
    if (!agent) {
      $('#notes-content').textContent = 'select an agent to view notes';
      return;
    }
    try {
      const res = await fetch(`/api/notes/${agent}`);
      const data = await res.json();
      $('#notes-content').textContent = data.notes || 'no notes found';
    } catch {
      $('#notes-content').textContent = 'error loading notes';
    }
  });
}

// --- Init ---

function init() {
  renderHeader();
  initTabs();
  initTerminal();
  initActions();

  // Initial state fetch
  fetch('/api/state')
    .then(r => r.json())
    .then(data => {
      state = { ...state, ...data };
      renderAll();
    })
    .catch(() => {
      updateStatus('no connection');
    });
}

document.addEventListener('DOMContentLoaded', init);
