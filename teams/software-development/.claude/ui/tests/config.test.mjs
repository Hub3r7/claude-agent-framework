import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getProjectRoot, getNotesDir, getStateDir, getAgentsDir, switchProject, getProjectInfo } from '../lib/config.mjs';

describe('config — path resolution', () => {
  it('getProjectRoot resolves to a directory (not UI dir)', () => {
    const root = getProjectRoot();
    assert.ok(root, 'PROJECT_ROOT should be defined');
    assert.ok(!root.endsWith('/ui'), 'should not be the UI directory');
    assert.ok(!root.endsWith('/lib'), 'should not be the lib directory');
  });

  it('getNotesDir is inside project root', () => {
    assert.ok(getNotesDir().startsWith(getProjectRoot()));
    assert.ok(getNotesDir().endsWith('.agentNotes'));
  });

  it('getStateDir is inside project root', () => {
    assert.ok(getStateDir().startsWith(getProjectRoot()));
    assert.ok(getStateDir().includes('.orchestra'));
  });

  it('getAgentsDir is inside project root', () => {
    assert.ok(getAgentsDir().startsWith(getProjectRoot()));
    assert.ok(getAgentsDir().includes('.claude'));
  });

  it('paths are absolute', () => {
    assert.ok(getProjectRoot().startsWith('/'));
    assert.ok(getNotesDir().startsWith('/'));
    assert.ok(getStateDir().startsWith('/'));
  });
});

describe('config — project switching', () => {
  it('switchProject returns false for non-project directory', () => {
    assert.equal(switchProject('/tmp'), false);
  });

  it('switchProject returns false for same project', () => {
    const root = getProjectRoot();
    assert.equal(switchProject(root), false);
  });

  it('getProjectInfo returns project metadata', () => {
    const info = getProjectInfo();
    assert.ok(info.root);
    assert.ok(info.name);
    assert.equal(typeof info.hasNotes, 'boolean');
    assert.equal(typeof info.hasState, 'boolean');
    assert.equal(typeof info.hasAgents, 'boolean');
  });
});
