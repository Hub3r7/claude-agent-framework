import { readFile, writeFile, mkdir, watch } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { existsSync, writeFileSync, renameSync, mkdirSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { getStateDir, getProjectRoot } from './config.mjs';

const DEFAULT_WORKFLOW = {
  version: 1,
  project: { cwd: getProjectRoot(), name: getProjectRoot().split('/').pop() },
  workflow: {
    tier: null,
    chain: [],
    chainIndex: 0,
    activeAgent: null,
    phase: null,
    mode: null,
    startedAt: null,
    updatedAt: null,
  },
  task: { id: null, summary: null, tier: null },
  verdicts: [],
  handoffs: [],
  stuckDetection: {
    window: [],
    maxWindowSize: 6,
    detected: false,
    reason: null,
    fixAttempts: 0,
  },
};

const DEFAULT_LEDGER = {
  version: 1,
  chains: [],
};

const DEFAULT_VERIFICATION = {
  version: 1,
  gates: [],
};

// Atomic file write: temp file + rename (adapted from GSD)
function atomicWriteSync(filePath, data) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const tmp = filePath + '.tmp.' + process.pid;
  writeFileSync(tmp, JSON.stringify(data, null, 2));
  renameSync(tmp, filePath);
}

async function readJsonFile(filePath, defaultValue) {
  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return structuredClone(defaultValue);
  }
}

// --- Stuck Detection (adapted from GSD detect-stuck.ts) ---

function detectStuck(window) {
  if (window.length < 2) return null;
  const last = window.at(-1);
  const prev = window.at(-2);

  // Rule 1: Same error repeated consecutively
  if (last.error && prev.error && last.error === prev.error) {
    return { stuck: true, reason: `Same error repeated: ${last.error.slice(0, 200)}` };
  }

  // Rule 2: Same unit 3+ consecutive times
  if (window.length >= 3 && window.slice(-3).every(u => u.key === last.key)) {
    return { stuck: true, reason: `${last.key} derived 3 consecutive times without progress` };
  }

  // Rule 3: Oscillation A↔B
  if (window.length >= 4) {
    const w = window.slice(-4);
    if (w[0].key === w[2].key && w[1].key === w[3].key && w[0].key !== w[1].key) {
      return { stuck: true, reason: `Oscillation detected: ${w[0].key} ↔ ${w[1].key}` };
    }
  }

  return null;
}

// --- State Manager ---

export function createStateManager() {
  const emitter = new EventEmitter();
  let cache = null;
  let cacheTime = 0;
  const CACHE_TTL = 100; // 100ms TTL (from GSD state.ts)

  async function ensureStateDir() {
    if (!existsSync(getStateDir())) {
      await mkdir(getStateDir(), { recursive: true });
    }
  }

  async function getWorkflow() {
    return readJsonFile(join(getStateDir(), 'workflow.json'), DEFAULT_WORKFLOW);
  }

  async function getLedger() {
    return readJsonFile(join(getStateDir(), 'ledger.json'), DEFAULT_LEDGER);
  }

  async function getVerification() {
    return readJsonFile(join(getStateDir(), 'verification.json'), DEFAULT_VERIFICATION);
  }

  async function getFullState() {
    const now = Date.now();
    if (cache && (now - cacheTime) < CACHE_TTL) return cache;

    await ensureStateDir();
    const [workflow, ledger, verification] = await Promise.all([
      getWorkflow(), getLedger(), getVerification(),
    ]);

    // Compute running project totals across all chains
    const projectTotals = (ledger.chains || []).reduce((acc, c) => {
      acc.tokens += c.totals?.tokens || 0;
      acc.durationMs += c.totals?.durationMs || 0;
      acc.estimatedCostEur += c.totals?.estimatedCostEur || 0;
      return acc;
    }, { tokens: 0, durationMs: 0, estimatedCostEur: 0 });

    cache = { ...workflow, ledger, verification, projectTotals };
    cacheTime = now;
    return cache;
  }

  function invalidateCache() {
    cache = null;
    cacheTime = 0;
  }

  async function saveWorkflow(data) {
    await ensureStateDir();
    atomicWriteSync(join(getStateDir(), 'workflow.json'), data);
    invalidateCache();
    emitter.emit('change');
  }

  async function saveLedger(data) {
    await ensureStateDir();
    atomicWriteSync(join(getStateDir(), 'ledger.json'), data);
    invalidateCache();
    emitter.emit('change');
  }

  async function saveVerification(data) {
    await ensureStateDir();
    atomicWriteSync(join(getStateDir(), 'verification.json'), data);
    invalidateCache();
    emitter.emit('change');
  }

  // --- Task Operations ---

  async function createOrUpdateTask({ summary, tier }) {
    const wf = await getWorkflow();
    const taskId = wf.task?.id || `T${String(Date.now()).slice(-4)}`;
    wf.task = { id: taskId, summary, tier: tier ?? null };
    wf.workflow.updatedAt = new Date().toISOString();
    await saveWorkflow(wf);
    return wf.task;
  }

  // --- Chain Operations ---

  async function loadProjectChains() {
    try {
      const chainsPath = join(getStateDir(), '..', 'chains.json');
      const raw = await readFile(chainsPath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  async function startChain({ taskId, tier, chain: customChain }) {
    const wf = await getWorkflow();
    const { getChainForTier } = await import('./chain-engine.mjs');

    // Use explicit chain if provided, otherwise check project chains.json, then defaults
    let chain;
    if (customChain && Array.isArray(customChain)) {
      chain = customChain;
    } else {
      const projectChains = await loadProjectChains();
      const overrides = projectChains.tiers || {};
      chain = overrides[tier] ? [...overrides[tier]] : getChainForTier(tier);
    }

    wf.workflow = {
      tier,
      chain,
      chainIndex: 0,
      activeAgent: chain[0] || null,
      phase: 'started',
      mode: null,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    wf.verdicts = [];
    wf.handoffs = [];
    wf.stuckDetection = {
      window: [],
      maxWindowSize: 6,
      detected: false,
      reason: null,
      fixAttempts: 0,
    };

    await saveWorkflow(wf);

    // Create ledger entry
    const ledger = await getLedger();
    ledger.chains.push({
      id: `chain-${randomUUID().slice(0, 8)}`,
      tier,
      task: taskId,
      startedAt: new Date().toISOString(),
      completedAt: null,
      entries: [],
      totals: { tokens: 0, durationMs: 0, estimatedCostEur: 0 },
    });
    await saveLedger(ledger);

    return { chain, tier };
  }

  // --- Verdict Operations ---

  async function recordVerdict({ agent, verdict, findings, tokens, durationMs, model }) {
    const wf = await getWorkflow();
    const { advanceChain, checkEscalation } = await import('./chain-engine.mjs');

    // Record verdict
    wf.verdicts.push({
      agent,
      verdict,
      findings: findings || {},
      chainStep: wf.workflow.chainIndex,
      timestamp: new Date().toISOString(),
    });

    // Track fix attempts: every FAIL from a review agent counts
    if (verdict === 'FAIL' && ['quality-gate', 'hunter', 'defender'].includes(agent)) {
      wf.stuckDetection.fixAttempts++;
    }

    // Update stuck detection window (GSD pattern)
    const entry = {
      key: agent,
      error: verdict === 'FAIL' ? `${agent} FAIL` : undefined,
      timestamp: Date.now(),
    };
    wf.stuckDetection.window.push(entry);
    if (wf.stuckDetection.window.length > wf.stuckDetection.maxWindowSize) {
      wf.stuckDetection.window.shift();
    }

    // Check stuck (GSD 3-rule detection)
    const stuckResult = detectStuck(wf.stuckDetection.window);
    if (stuckResult) {
      wf.stuckDetection.detected = true;
      wf.stuckDetection.reason = stuckResult.reason;
    } else {
      wf.stuckDetection.detected = false;
      wf.stuckDetection.reason = null;
    }

    // Check escalation threshold (Superpowers: 3 failed fixes → architectural review)
    const escalation = checkEscalation(wf.verdicts);
    if (escalation.escalate) {
      wf.stuckDetection.detected = true;
      wf.stuckDetection.reason = escalation.reason;
    }

    // Advance or loop back (respects Mode A/B)
    const nextState = advanceChain(wf.workflow, verdict);
    wf.workflow = { ...wf.workflow, ...nextState, updatedAt: new Date().toISOString() };

    await saveWorkflow(wf);

    // Update ledger
    if (tokens || durationMs) {
      const { calculateCost } = await import('./cost-calculator.mjs');
      const ledger = await getLedger();
      const currentChain = ledger.chains[ledger.chains.length - 1];
      if (currentChain) {
        const costEur = calculateCost(tokens || 0, model || 'sonnet');
        currentChain.entries.push({
          agent,
          model: model || 'sonnet',
          tokens: tokens || 0,
          durationMs: durationMs || 0,
          verdict,
          estimatedCostEur: costEur,
          timestamp: new Date().toISOString(),
        });
        currentChain.totals.tokens = currentChain.entries.reduce((s, e) => s + e.tokens, 0);
        currentChain.totals.durationMs = currentChain.entries.reduce((s, e) => s + e.durationMs, 0);
        currentChain.totals.estimatedCostEur = currentChain.entries.reduce((s, e) => s + e.estimatedCostEur, 0);
        await saveLedger(ledger);
      }
    }

    return { verdict, nextAgent: wf.workflow.activeAgent, stuck: wf.stuckDetection };
  }

  // --- File Watcher ---

  (async () => {
    await ensureStateDir();
    try {
      const watcher = watch(getStateDir());
      let debounce = null;
      for await (const event of watcher) {
        if (event.filename?.endsWith('.json')) {
          clearTimeout(debounce);
          debounce = setTimeout(() => {
            invalidateCache();
            emitter.emit('change');
          }, 200);
        }
      }
    } catch {
      // Watcher not available
    }
  })();

  // --- Orchestrator / free-form ledger entry (no chain advancement) ---

  async function addLedgerEntry({ agent, tokens, durationMs, model, verdict }) {
    const ledger = await getLedger();
    const currentChain = ledger.chains[ledger.chains.length - 1];
    if (!currentChain) return { ok: false, reason: 'no active chain' };

    const { calculateCost } = await import('./cost-calculator.mjs');
    const costEur = calculateCost(tokens || 0, model || 'sonnet');

    // Update existing entry for this agent if present, otherwise append
    const existing = currentChain.entries.findIndex(e => e.agent === agent);
    const entry = {
      agent,
      model: model || 'sonnet',
      tokens: tokens || 0,
      durationMs: durationMs || 0,
      verdict: verdict || '—',
      estimatedCostEur: costEur,
      timestamp: new Date().toISOString(),
    };
    if (existing !== -1) {
      currentChain.entries[existing] = entry;
    } else {
      currentChain.entries.push(entry);
    }

    currentChain.totals.tokens = currentChain.entries.reduce((s, e) => s + e.tokens, 0);
    currentChain.totals.durationMs = currentChain.entries.reduce((s, e) => s + e.durationMs, 0);
    currentChain.totals.estimatedCostEur = currentChain.entries.reduce((s, e) => s + e.estimatedCostEur, 0);

    await saveLedger(ledger);
    return { ok: true, agent, costEur };
  }

  return {
    getFullState,
    createOrUpdateTask,
    startChain,
    recordVerdict,
    addLedgerEntry,
    on: (event, handler) => emitter.on(event, handler),
  };
}
