import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getChainForTier, advanceChain, checkEscalation, determineTier } from '../lib/chain-engine.mjs';

describe('getChainForTier', () => {
  it('returns correct chain for Tier 0', () => {
    const chain = getChainForTier(0);
    assert.deepEqual(chain, ['developer', 'docs']);
  });

  it('returns correct chain for Tier 1', () => {
    const chain = getChainForTier(1);
    assert.deepEqual(chain, ['developer', 'quality-gate', 'docs']);
  });

  it('returns correct chain for Tier 2', () => {
    const chain = getChainForTier(2);
    assert.deepEqual(chain, ['architect', 'quality-gate', 'developer', 'quality-gate', 'docs']);
  });

  it('returns correct chain for Tier 3 (default: hunter)', () => {
    const chain = getChainForTier(3);
    assert.deepEqual(chain, ['architect', 'quality-gate', 'developer', 'quality-gate', 'hunter', 'docs']);
  });

  it('returns correct chain for Tier 3 with defender', () => {
    const chain = getChainForTier(3, { useDefender: true });
    assert.deepEqual(chain, ['architect', 'quality-gate', 'developer', 'quality-gate', 'defender', 'docs']);
  });

  it('returns correct chain for Tier 4', () => {
    const chain = getChainForTier(4);
    assert.deepEqual(chain, ['architect', 'quality-gate', 'developer', 'quality-gate', 'hunter', 'defender', 'docs']);
  });

  it('inserts ui-designer after architect for Tier 2+', () => {
    const chain = getChainForTier(2, { includeUiDesigner: true });
    assert.equal(chain[0], 'architect');
    assert.equal(chain[1], 'ui-designer');
    assert.equal(chain[2], 'quality-gate');
  });

  it('does not insert ui-designer for Tier 0-1', () => {
    const chain = getChainForTier(1, { includeUiDesigner: true });
    assert.ok(!chain.includes('ui-designer'));
  });

  it('falls back to Tier 1 for unknown tier', () => {
    const chain = getChainForTier(99);
    assert.deepEqual(chain, ['developer', 'quality-gate', 'docs']);
  });
});

describe('advanceChain — PASS', () => {
  it('moves to next agent on PASS', () => {
    const workflow = { chain: ['developer', 'quality-gate', 'docs'], chainIndex: 0 };
    const result = advanceChain(workflow, 'PASS');
    assert.equal(result.chainIndex, 1);
    assert.equal(result.activeAgent, 'quality-gate');
    assert.equal(result.phase, 'running');
  });

  it('completes chain when PASS on last agent', () => {
    const workflow = { chain: ['developer', 'docs'], chainIndex: 1 };
    const result = advanceChain(workflow, 'PASS');
    assert.equal(result.phase, 'completed');
    assert.equal(result.activeAgent, null);
  });
});

describe('advanceChain — FAIL Mode A (pre-impl quality-gate)', () => {
  it('returns to architect when quality-gate fails before developer', () => {
    // Tier 2: architect(0) → quality-gate(1) → developer(2) → quality-gate(3) → docs(4)
    const chain = ['architect', 'quality-gate', 'developer', 'quality-gate', 'docs'];
    const workflow = { chain, chainIndex: 1 }; // quality-gate at index 1 (before developer at 2)
    const result = advanceChain(workflow, 'FAIL');
    assert.equal(result.activeAgent, 'architect');
    assert.equal(result.phase, 'design-revision');
  });

  it('returns to ui-designer when present and quality-gate Mode A fails', () => {
    const chain = ['architect', 'ui-designer', 'quality-gate', 'developer', 'quality-gate', 'docs'];
    const workflow = { chain, chainIndex: 2 }; // quality-gate at 2, developer at 3
    const result = advanceChain(workflow, 'FAIL');
    assert.equal(result.activeAgent, 'ui-designer');
    assert.equal(result.phase, 'design-revision');
  });
});

describe('advanceChain — FAIL Mode B (post-impl quality-gate)', () => {
  it('returns to developer when quality-gate fails after developer', () => {
    const chain = ['architect', 'quality-gate', 'developer', 'quality-gate', 'docs'];
    const workflow = { chain, chainIndex: 3 }; // quality-gate at 3 (after developer at 2)
    const result = advanceChain(workflow, 'FAIL');
    assert.equal(result.activeAgent, 'developer');
    assert.equal(result.phase, 'fix-required');
  });
});

describe('advanceChain — FAIL hunter/defender', () => {
  it('returns to developer when hunter fails', () => {
    const chain = ['architect', 'quality-gate', 'developer', 'quality-gate', 'hunter', 'docs'];
    const workflow = { chain, chainIndex: 4 };
    const result = advanceChain(workflow, 'FAIL');
    assert.equal(result.activeAgent, 'developer');
    assert.equal(result.phase, 'fix-required');
  });

  it('returns to developer when defender fails', () => {
    const chain = ['architect', 'quality-gate', 'developer', 'quality-gate', 'hunter', 'defender', 'docs'];
    const workflow = { chain, chainIndex: 5 };
    const result = advanceChain(workflow, 'FAIL');
    assert.equal(result.activeAgent, 'developer');
  });
});

describe('checkEscalation', () => {
  it('does not escalate with 0-2 failures', () => {
    const verdicts = [
      { agent: 'quality-gate', verdict: 'FAIL' },
      { agent: 'quality-gate', verdict: 'FAIL' },
    ];
    const result = checkEscalation(verdicts);
    assert.equal(result.escalate, false);
    assert.equal(result.failCount, 2);
  });

  it('escalates at 3 failures', () => {
    const verdicts = [
      { agent: 'quality-gate', verdict: 'FAIL' },
      { agent: 'quality-gate', verdict: 'FAIL' },
      { agent: 'hunter', verdict: 'FAIL' },
    ];
    const result = checkEscalation(verdicts);
    assert.equal(result.escalate, true);
    assert.equal(result.failCount, 3);
  });

  it('ignores PASS verdicts and non-review agents', () => {
    const verdicts = [
      { agent: 'quality-gate', verdict: 'PASS' },
      { agent: 'developer', verdict: 'FAIL' },
      { agent: 'quality-gate', verdict: 'FAIL' },
    ];
    const result = checkEscalation(verdicts);
    assert.equal(result.escalate, false);
    assert.equal(result.failCount, 1);
  });
});

describe('determineTier', () => {
  it('returns Tier 4 for security-related tasks', () => {
    assert.equal(determineTier('Add auth middleware'), 4);
    assert.equal(determineTier('Implement encryption'), 4);
  });

  it('returns Tier 3 for API/network tasks', () => {
    assert.equal(determineTier('Add webhook integration'), 3);
    assert.equal(determineTier('Database migration'), 3);
  });

  it('returns Tier 2 for feature tasks', () => {
    assert.equal(determineTier('New component for dashboard'), 2);
    assert.equal(determineTier('Refactor user module'), 2);
  });

  it('returns Tier 1 for bug fixes', () => {
    assert.equal(determineTier('Fix login bug'), 1);
  });

  it('returns Tier 0 for trivial changes', () => {
    assert.equal(determineTier('Fix typo in readme'), 0);
  });

  it('defaults to Tier 1', () => {
    assert.equal(determineTier('do something'), 1);
  });
});
