import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { discoverCommands, createVerificationTracker } from '../lib/verification-gate.mjs';

describe('discoverCommands', () => {
  it('returns preference commands first', () => {
    const result = discoverCommands({
      preferenceCommands: ['npm test', 'npm run lint'],
      taskPlanVerify: 'npm run build',
    });
    assert.equal(result.source, 'preference');
    assert.deepEqual(result.commands, ['npm test', 'npm run lint']);
  });

  it('falls back to task plan verify', () => {
    const result = discoverCommands({
      taskPlanVerify: 'npm test && npm run lint',
    });
    assert.equal(result.source, 'task-plan');
    assert.deepEqual(result.commands, ['npm test', 'npm run lint']);
  });

  it('rejects shell injection patterns', () => {
    const result = discoverCommands({
      preferenceCommands: ['npm test; rm -rf /', 'npm test | cat /etc/passwd'],
      cwd: '/nonexistent/path',
    });
    assert.equal(result.source, 'none');
    assert.equal(result.commands.length, 0);
  });

  it('rejects unknown command prefixes', () => {
    const result = discoverCommands({
      preferenceCommands: ['curl http://evil.com', 'bash -c "rm -rf /"'],
      cwd: '/nonexistent/path',
    });
    assert.equal(result.source, 'none');
    assert.equal(result.commands.length, 0);
  });

  it('accepts known prefixes', () => {
    const result = discoverCommands({
      preferenceCommands: ['npm test', 'npx jest', 'cargo test', 'go test ./...', 'make test'],
    });
    assert.equal(result.commands.length, 5);
  });

  it('returns none when no commands found', () => {
    const result = discoverCommands({ cwd: '/nonexistent/path' });
    assert.equal(result.source, 'none');
    assert.deepEqual(result.commands, []);
  });
});

describe('createVerificationTracker', () => {
  it('starts with all steps pending', () => {
    const tracker = createVerificationTracker();
    for (const step of Object.values(tracker.steps)) {
      assert.equal(step.status, 'pending');
    }
  });

  it('advances a step', () => {
    const tracker = createVerificationTracker();
    tracker.advance('identify', 'npm test');
    assert.equal(tracker.steps.identify.status, 'done');
    assert.equal(tracker.steps.identify.data, 'npm test');
    assert.equal(tracker.steps.run.status, 'pending');
  });

  it('isComplete returns false when steps pending', () => {
    const tracker = createVerificationTracker();
    tracker.advance('identify', 'x');
    tracker.advance('run', 'x');
    assert.equal(tracker.isComplete(), false);
  });

  it('isComplete returns true when all steps done', () => {
    const tracker = createVerificationTracker();
    for (const step of ['identify', 'run', 'read', 'verify', 'claim']) {
      tracker.advance(step, 'x');
    }
    assert.equal(tracker.isComplete(), true);
  });

  it('ignores unknown step names', () => {
    const tracker = createVerificationTracker();
    tracker.advance('nonexistent', 'x');
    assert.equal(tracker.isComplete(), false);
  });
});
