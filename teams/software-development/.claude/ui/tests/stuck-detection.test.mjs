import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Import detectStuck from state-manager — it's not exported directly,
// so we test it through the module's behavior or re-implement for testing.
// Since it's a pure function, we copy it here for isolated testing.

function detectStuck(window) {
  if (window.length < 2) return null;
  const last = window.at(-1);
  const prev = window.at(-2);

  if (last.error && prev.error && last.error === prev.error) {
    return { stuck: true, reason: `Same error repeated: ${last.error.slice(0, 200)}` };
  }

  if (window.length >= 3 && window.slice(-3).every(u => u.key === last.key)) {
    return { stuck: true, reason: `${last.key} derived 3 consecutive times without progress` };
  }

  if (window.length >= 4) {
    const w = window.slice(-4);
    if (w[0].key === w[2].key && w[1].key === w[3].key && w[0].key !== w[1].key) {
      return { stuck: true, reason: `Oscillation detected: ${w[0].key} ↔ ${w[1].key}` };
    }
  }

  return null;
}

describe('detectStuck', () => {
  it('returns null for empty window', () => {
    assert.equal(detectStuck([]), null);
  });

  it('returns null for single entry', () => {
    assert.equal(detectStuck([{ key: 'a' }]), null);
  });

  it('returns null for normal progression', () => {
    const window = [
      { key: 'architect' },
      { key: 'quality-gate' },
      { key: 'developer' },
    ];
    assert.equal(detectStuck(window), null);
  });

  // Rule 1: Same error repeated consecutively
  it('detects same error repeated', () => {
    const window = [
      { key: 'quality-gate', error: 'missing tests' },
      { key: 'quality-gate', error: 'missing tests' },
    ];
    const result = detectStuck(window);
    assert.ok(result);
    assert.equal(result.stuck, true);
    assert.ok(result.reason.includes('Same error repeated'));
  });

  it('does not trigger rule 1 for different errors', () => {
    const window = [
      { key: 'quality-gate', error: 'missing tests' },
      { key: 'quality-gate', error: 'naming violation' },
    ];
    assert.equal(detectStuck(window), null);
  });

  // Rule 2: Same unit 3+ consecutive times
  it('detects 3 consecutive same unit', () => {
    const window = [
      { key: 'developer' },
      { key: 'developer' },
      { key: 'developer' },
    ];
    const result = detectStuck(window);
    assert.ok(result);
    assert.ok(result.reason.includes('3 consecutive times'));
  });

  it('does not trigger rule 2 with only 2 consecutive', () => {
    const window = [
      { key: 'quality-gate' },
      { key: 'developer' },
      { key: 'developer' },
    ];
    assert.equal(detectStuck(window), null);
  });

  // Rule 3: Oscillation A↔B
  it('detects A-B-A-B oscillation', () => {
    const window = [
      { key: 'developer' },
      { key: 'quality-gate' },
      { key: 'developer' },
      { key: 'quality-gate' },
    ];
    const result = detectStuck(window);
    assert.ok(result);
    assert.ok(result.reason.includes('Oscillation'));
    assert.ok(result.reason.includes('developer'));
    assert.ok(result.reason.includes('quality-gate'));
  });

  it('does not trigger oscillation for A-B-C-A', () => {
    const window = [
      { key: 'developer' },
      { key: 'quality-gate' },
      { key: 'hunter' },
      { key: 'developer' },
    ];
    assert.equal(detectStuck(window), null);
  });

  it('truncates error in reason to 200 chars', () => {
    const longError = 'x'.repeat(300);
    const window = [
      { key: 'a', error: longError },
      { key: 'a', error: longError },
    ];
    const result = detectStuck(window);
    assert.ok(result.reason.length < 250);
  });
});
