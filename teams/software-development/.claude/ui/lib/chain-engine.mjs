// Chain engine: tier→chain mapping, chain advancement, stuck detection
// Adapted from CLAUDE.md tier definitions

const TIER_CHAINS = {
  0: ['developer', 'docs'],
  1: ['developer', 'quality-gate', 'docs'],
  2: ['architect', 'quality-gate', 'developer', 'quality-gate', 'docs'],
  3: ['architect', 'quality-gate', 'developer', 'quality-gate', 'hunter', 'docs'],
  4: ['architect', 'quality-gate', 'developer', 'quality-gate', 'hunter', 'defender', 'docs'],
};

// Tier 3 variant: defender instead of hunter (for data/artifacts tasks)
const TIER3_DEFENDER = ['architect', 'quality-gate', 'developer', 'quality-gate', 'defender', 'docs'];

// Quality-gate mode detection based on chain position
// Mode A (design review): quality-gate appears BEFORE developer
// Mode B (code review): quality-gate appears AFTER developer
function getQualityGateMode(chain, chainIndex) {
  const agent = chain[chainIndex];
  if (agent !== 'quality-gate') return null;

  // Find the developer position in chain
  const devIdx = chain.indexOf('developer');
  if (devIdx === -1) return 'B'; // no developer = treat as code review

  return chainIndex < devIdx ? 'A' : 'B';
}

/**
 * Get the agent chain for a given tier.
 * @param {number} tier - 0 to 4
 * @param {object} options - { useDefender: bool, includeUiDesigner: bool }
 */
export function getChainForTier(tier, options = {}) {
  let chain = [...(TIER_CHAINS[tier] || TIER_CHAINS[1])];

  // Tier 3: swap hunter for defender if data/artifacts task
  if (tier === 3 && options.useDefender) {
    chain = [...TIER3_DEFENDER];
  }

  // Insert ui-designer after architect if UI task
  if (options.includeUiDesigner && tier >= 2) {
    const archIdx = chain.indexOf('architect');
    if (archIdx !== -1) {
      chain.splice(archIdx + 1, 0, 'ui-designer');
    }
  }

  return chain;
}

/**
 * Advance chain based on verdict.
 * PASS → move to next agent
 * FAIL → loop back depending on Mode A/B
 *
 * Mode A FAIL (design review) → return to architect/ui-designer
 * Mode B FAIL (code review) → return to developer
 * Hunter/defender FAIL → return to developer
 */
export function advanceChain(workflow, verdict) {
  const { chain, chainIndex } = workflow;
  const currentAgent = chain[chainIndex];

  if (verdict === 'PASS') {
    const nextIndex = chainIndex + 1;
    if (nextIndex >= chain.length) {
      return {
        chainIndex: nextIndex,
        activeAgent: null,
        phase: 'completed',
        mode: null,
      };
    }
    const nextAgent = chain[nextIndex];
    const nextMode = getQualityGateMode(chain, nextIndex);
    return {
      chainIndex: nextIndex,
      activeAgent: nextAgent,
      phase: 'running',
      mode: nextMode,
    };
  }

  if (verdict === 'FAIL') {
    if (currentAgent === 'quality-gate') {
      const mode = getQualityGateMode(chain, chainIndex);

      if (mode === 'A') {
        // Mode A FAIL: return to architect (or ui-designer if present before this QG)
        for (let i = chainIndex - 1; i >= 0; i--) {
          if (chain[i] === 'ui-designer' || chain[i] === 'architect') {
            return {
              chainIndex: i,
              activeAgent: chain[i],
              phase: 'design-revision',
              mode: null,
            };
          }
        }
      }

      // Mode B FAIL: return to developer
      const devIdx = chain.indexOf('developer');
      if (devIdx !== -1 && devIdx < chainIndex) {
        return {
          chainIndex: devIdx,
          activeAgent: 'developer',
          phase: 'fix-required',
          mode: null,
        };
      }
    }

    // Hunter/defender FAIL → return to developer
    if (['hunter', 'defender'].includes(currentAgent)) {
      const devIdx = chain.indexOf('developer');
      if (devIdx !== -1) {
        return {
          chainIndex: devIdx,
          activeAgent: 'developer',
          phase: 'fix-required',
          mode: null,
        };
      }
    }

    // Default: stay at current position
    return {
      chainIndex,
      activeAgent: currentAgent,
      phase: 'fix-required',
      mode: null,
    };
  }

  return workflow;
}

/**
 * Check if debugging escalation threshold reached.
 * After 3 FAIL→developer loops on the same chain, flag for architectural review.
 * Adapted from Superpowers systematic-debugging escalation.
 */
export function checkEscalation(verdicts) {
  const failToDevCount = verdicts.filter(v =>
    v.verdict === 'FAIL' && ['quality-gate', 'hunter', 'defender'].includes(v.agent)
  ).length;

  if (failToDevCount >= 3) {
    return {
      escalate: true,
      reason: `${failToDevCount} review failures — architectural review recommended before attempting fix #${failToDevCount + 1}`,
      failCount: failToDevCount,
    };
  }

  return { escalate: false, failCount: failToDevCount };
}

/**
 * Determine tier based on task description heuristics.
 */
export function determineTier(description) {
  const desc = description.toLowerCase();

  // Check from highest to lowest, but Tier 0 keywords take priority when
  // the task is clearly trivial (typo, comment, label override "fix")
  if (/\b(typo|comment fix|config label)\b/.test(desc)) return 0;
  if (/\b(auth|crypto|security|credential|token|encrypt|decrypt|encryption|decryption)\b/.test(desc)) return 4;
  if (/\b(major component|core module|shared code|breaking change)\b/.test(desc)) return 4;
  if (/\b(api|network|http|external|integration|webhook|socket)\b/.test(desc)) return 3;
  if (/\b(database|persist|storage|migration|artifact)\b/.test(desc)) return 3;
  if (/\b(feature|refactor|component|module|new file)\b/.test(desc)) return 2;
  if (/\b(fix|bug|patch|tweak|small)\b/.test(desc)) return 1;
  if (/\b(readme|doc|comment|label)\b/.test(desc)) return 0;

  return 1;
}
