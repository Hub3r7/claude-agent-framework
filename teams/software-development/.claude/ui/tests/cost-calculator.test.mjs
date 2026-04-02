import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateCost, estimateOrchestratorTokens, formatCostEur } from '../lib/cost-calculator.mjs';

describe('calculateCost', () => {
  it('calculates opus cost correctly', () => {
    const cost = calculateCost(1_000_000, 'opus');
    assert.equal(cost, 8.55);
  });

  it('calculates sonnet cost correctly', () => {
    const cost = calculateCost(1_000_000, 'sonnet');
    assert.equal(cost, 5.13);
  });

  it('calculates haiku cost correctly', () => {
    const cost = calculateCost(1_000_000, 'haiku');
    assert.equal(cost, 1.71);
  });

  it('handles zero tokens', () => {
    assert.equal(calculateCost(0, 'opus'), 0);
  });

  it('handles partial model name match', () => {
    const cost = calculateCost(1_000_000, 'claude-opus-4');
    assert.equal(cost, 8.55);
  });

  it('defaults to sonnet for unknown model', () => {
    const cost = calculateCost(1_000_000, 'unknown-model');
    assert.equal(cost, 5.13);
  });

  it('calculates proportional cost for partial token counts', () => {
    const cost = calculateCost(21307, 'opus');
    assert.ok(Math.abs(cost - 0.1822) < 0.001);
  });
});

describe('estimateOrchestratorTokens', () => {
  it('multiplies tool calls by 7500', () => {
    assert.equal(estimateOrchestratorTokens(10), 75000);
    assert.equal(estimateOrchestratorTokens(0), 0);
    assert.equal(estimateOrchestratorTokens(1), 7500);
  });
});

describe('formatCostEur', () => {
  it('formats with euro sign and 2 decimals', () => {
    assert.equal(formatCostEur(1.5), '€1.50');
    assert.equal(formatCostEur(0), '€0.00');
    assert.equal(formatCostEur(0.182), '€0.18');
  });
});
