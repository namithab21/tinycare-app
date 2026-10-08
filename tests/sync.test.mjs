import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toSyncable, applyRemote, mergeConcurrent, signature } from '../src/services/sync.ts';

const base = () => ({
  account: { id: 'u', name: 'Asha', phone: '9876543210', createdAt: 'x' },
  onboardingDone: true, metrics: [], moods: [], screenings: [], children: [], growth: [], vaccinations: [], completions: [],
  inbox: [{ id: 'i1', title: 't', message: 'm', read: false }],
  settings: { language: 'en', region: 'SOUTH', appLock: true, remindersEnabled: true, theme: 'system' },
});

test('toSyncable strips account, inbox and device-only settings', () => {
  const p = toSyncable(base());
  assert.equal(p.account, undefined); assert.equal(p.inbox, undefined);
  assert.deepEqual(p.settings, { language: 'en', region: 'SOUTH', theme: 'system' });
});

test('applyRemote replaces records but keeps account, inbox, app lock and reminders', () => {
  const local = base();
  const remote = { ...toSyncable(base()), children: [{ id: 'c1', name: 'Aarav' }], settings: { language: 'hi', region: 'WEST', theme: 'dark' } };
  const out = applyRemote(local, remote);
  assert.equal(out.children.length, 1); assert.equal(out.account.phone, '9876543210'); assert.equal(out.inbox.length, 1);
  assert.deepEqual(out.settings, { language: 'hi', region: 'WEST', theme: 'dark', appLock: true, remindersEnabled: true });
});

test('applyRemote tolerates a malformed/partial remote payload', () => {
  const out = applyRemote(base(), { children: 'garbage', metrics: null });
  assert.deepEqual(out.children, []); assert.deepEqual(out.metrics, []); assert.equal(out.settings.language, 'en');
});

test('mergeConcurrent keeps local children but unions logs from the other device', () => {
  const local = { ...base(), children: [{ id: 'c1' }], metrics: [{ id: 'm1' }], growth: [{ id: 'g1', childId: 'c1' }] };
  const remote = { children: [{ id: 'c1' }, { id: 'c2' }], metrics: [{ id: 'm1' }, { id: 'm2' }], growth: [{ id: 'g2', childId: 'c1' }, { id: 'g3', childId: 'c2' }] };
  const out = mergeConcurrent(local, remote);
  assert.deepEqual(out.children.map((c) => c.id), ['c1'], 'local child list wins');
  assert.deepEqual(out.metrics.map((m) => m.id), ['m1', 'm2']);
  assert.deepEqual(out.growth.map((g) => g.id), ['g1', 'g2'], 'drops growth for a child that was removed locally');
});

test('signature changes only when synced data changes', () => {
  const a = base(); const sig = signature(a);
  assert.equal(signature({ ...a, inbox: [] }), sig);
  assert.equal(signature({ ...a, settings: { ...a.settings, appLock: false } }), sig);
  assert.notEqual(signature({ ...a, metrics: [{ id: 'm' }] }), sig);
  assert.notEqual(signature({ ...a, settings: { ...a.settings, language: 'ta' } }), sig);
});
