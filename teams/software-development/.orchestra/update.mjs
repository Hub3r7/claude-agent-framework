#!/usr/bin/env node
/**
 * Orchestra state updater — called by the orchestrator at each chain step.
 * Zero external dependencies. Handles atomic writes and chain advancement.
 *
 * Usage:
 *   node .orchestra/update.mjs chain-start '{"tier":2,"taskId":"T1234","summary":"...","chain":["architect","developer","docs"]}'
 *   node .orchestra/update.mjs verdict '{"agent":"architect","verdict":"PASS","tokens":12000,"durationMs":45000}'
 *   node .orchestra/update.mjs blocked '{"agent":"developer"}'
 */

import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';

// --- Paths ---

const __dir = dirname(fileURLToPath(import.meta.url));
// Script lives at .claude/.orchestra/update.mjs → state goes to .claude/.orchestra/state/
const STATE_DIR = join(__dir, 'state');

if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });

function statePath(name) { return join(STATE_DIR, name); }

// --- Atomic I/O ---

function readJson(name, def) {
  try { return JSON.parse(readFileSync(statePath(name), 'utf-8')); }
  catch { return structuredClone(def); }
}

function writeJson(name, data) {
  const path = statePath(name);
  const tmp = path + '.tmp.' + process.pid;
  writeFileSync(tmp, JSON.stringify(data, null, 2));
  renameSync(tmp, path);
}

// --- Defaults ---

const WF_DEFAULT = {
  version: 1,
  project: { cwd: process.cwd(), name: process.cwd().split('/').pop() },
  workflow: { tier: null, chain: [], chainIndex: 0, activeAgent: null, phase: null, mode: null, startedAt: null, updatedAt: null },
  task: { id: null, summary: null, tier: null },
  verdicts: [],
  handoffs: [],
  stuckDetection: { window: [], maxWindowSize: 6, detected: false, reason: null, fixAttempts: 0 },
};

const LEDGER_DEFAULT = { version: 1, chains: [] };

// --- Chain advancement (mirrors chain-engine.mjs logic) ---

function advanceChain(wf, verdict) {
  const { chain, chainIndex } = wf.workflow;
  const current = chain[chainIndex];

  if (verdict === 'PASS') {
    const next = chainIndex + 1;
    if (next >= chain.length) {
      return { chainIndex: next, activeAgent: null, phase: 'completed', mode: null };
    }
    return { chainIndex: next, activeAgent: chain[next], phase: 'running', mode: null };
  }

  if (verdict === 'FAIL') {
    if (current === 'quality-gate') {
      const devIdx = chain.indexOf('developer');
      // Mode A: quality-gate before developer → back to architect/ui-designer
      if (devIdx > chainIndex) {
        for (let i = chainIndex - 1; i >= 0; i--) {
          if (chain[i] === 'ui-designer' || chain[i] === 'architect') {
            return { chainIndex: i, activeAgent: chain[i], phase: 'design-revision', mode: null };
          }
        }
      }
      // Mode B: quality-gate after developer → back to developer
      if (devIdx !== -1 && devIdx < chainIndex) {
        return { chainIndex: devIdx, activeAgent: 'developer', phase: 'fix-required', mode: null };
      }
    }
    if (['hunter', 'defender'].includes(current)) {
      const devIdx = chain.indexOf('developer');
      if (devIdx !== -1) return { chainIndex: devIdx, activeAgent: 'developer', phase: 'fix-required', mode: null };
    }
    return { chainIndex, activeAgent: current, phase: 'fix-required', mode: null };
  }

  return {};
}

// --- Cost estimate (€ per 1k tokens, Sonnet rate) ---

const COST_PER_1K = 0.003;
function estimateCost(tokens) { return Math.round((tokens / 1000) * COST_PER_1K * 10000) / 10000; }

// --- Commands ---

function cmdChainStart(args) {
  const { tier, taskId, summary, chain } = args;
  const chainArr = Array.isArray(chain) ? chain : String(chain).split(',').map(s => s.trim());
  const id = taskId || ('T' + String(Date.now()).slice(-4));
  const now = new Date().toISOString();
  const chainId = 'chain-' + randomBytes(4).toString('hex');

  const wf = readJson('workflow.json', WF_DEFAULT);
  wf.project = { cwd: process.cwd(), name: process.cwd().split('/').pop() };
  wf.workflow = {
    tier: tier ?? null,
    chain: chainArr,
    chainIndex: 0,
    activeAgent: chainArr[0] || null,
    phase: 'started',
    mode: null,
    startedAt: now,
    updatedAt: now,
  };
  wf.task = { id, summary: summary || null, tier: tier ?? null };
  wf.verdicts = [];
  wf.handoffs = [];
  wf.stuckDetection = { window: [], maxWindowSize: 6, detected: false, reason: null, fixAttempts: 0 };
  writeJson('workflow.json', wf);

  const ledger = readJson('ledger.json', LEDGER_DEFAULT);
  ledger.chains.push({ id: chainId, tier: tier ?? null, task: id, startedAt: now, completedAt: null, entries: [], totals: { tokens: 0, durationMs: 0, estimatedCostEur: 0 } });
  writeJson('ledger.json', ledger);

  console.log(`[orchestra] chain-start tier=${tier} chain=${chainArr.join('→')} task=${id}`);
}

function cmdVerdict(args) {
  const { agent, verdict, tokens = 0, durationMs = 0, model = 'sonnet' } = args;
  const now = new Date().toISOString();

  const wf = readJson('workflow.json', WF_DEFAULT);

  // Append verdict
  wf.verdicts.push({ agent, verdict, chainStep: wf.workflow.chainIndex, timestamp: now });

  // Stuck detection
  if (verdict === 'FAIL' && ['quality-gate', 'hunter', 'defender'].includes(agent)) {
    wf.stuckDetection.fixAttempts = (wf.stuckDetection.fixAttempts || 0) + 1;
  }
  const w = wf.stuckDetection.window;
  w.push({ key: agent, error: verdict === 'FAIL' ? `${agent} FAIL` : undefined, timestamp: Date.now() });
  if (w.length > wf.stuckDetection.maxWindowSize) w.shift();

  // Check stuck: same error twice in a row
  if (w.length >= 2 && w.at(-1).error && w.at(-1).error === w.at(-2).error) {
    wf.stuckDetection.detected = true;
    wf.stuckDetection.reason = `Same error repeated: ${w.at(-1).error}`;
  } else if (wf.stuckDetection.fixAttempts >= 3) {
    wf.stuckDetection.detected = true;
    wf.stuckDetection.reason = `${wf.stuckDetection.fixAttempts} review failures — architectural review recommended`;
  } else {
    wf.stuckDetection.detected = false;
    wf.stuckDetection.reason = null;
  }

  // Advance chain
  const next = advanceChain(wf, verdict);
  wf.workflow = { ...wf.workflow, ...next, updatedAt: now };
  writeJson('workflow.json', wf);

  // Update ledger
  const ledger = readJson('ledger.json', LEDGER_DEFAULT);
  const chain = ledger.chains[ledger.chains.length - 1];
  if (chain) {
    const cost = estimateCost(tokens);
    chain.entries.push({ agent, model, tokens, durationMs, verdict, estimatedCostEur: cost, timestamp: now });
    chain.totals.tokens = chain.entries.reduce((s, e) => s + e.tokens, 0);
    chain.totals.durationMs = chain.entries.reduce((s, e) => s + e.durationMs, 0);
    chain.totals.estimatedCostEur = chain.entries.reduce((s, e) => s + e.estimatedCostEur, 0);
    if (wf.workflow.phase === 'completed') chain.completedAt = now;
    writeJson('ledger.json', ledger);
  }

  console.log(`[orchestra] verdict agent=${agent} verdict=${verdict} → next=${wf.workflow.activeAgent || 'done'} stuck=${wf.stuckDetection.detected}`);
}

function cmdBlocked(args) {
  const { agent } = args;
  const wf = readJson('workflow.json', WF_DEFAULT);
  wf.workflow.phase = 'blocked';
  wf.workflow.activeAgent = agent;
  wf.workflow.updatedAt = new Date().toISOString();
  writeJson('workflow.json', wf);
  console.log(`[orchestra] blocked agent=${agent}`);
}

// --- Entry point ---

const [,, cmd, jsonArg] = process.argv;

if (!cmd) {
  console.error('Usage: node .orchestra/update.mjs <chain-start|verdict|blocked> <json>');
  process.exit(1);
}

let args = {};
try { args = jsonArg ? JSON.parse(jsonArg) : {}; }
catch { console.error('Invalid JSON:', jsonArg); process.exit(1); }

switch (cmd) {
  case 'chain-start': cmdChainStart(args); break;
  case 'verdict':     cmdVerdict(args);    break;
  case 'blocked':     cmdBlocked(args);    break;
  default:
    console.error('Unknown command:', cmd);
    process.exit(1);
}
