const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('independent backend applications do not share users, sessions, or OM state', async () => {
  const modulePath = path.join(__dirname, '../server-modules/application.js');
  assert.ok(fs.existsSync(modulePath), 'application composition module must exist');
  const { createApplication } = require(modulePath);
  const first = createApplication({ root: path.join(__dirname, '..'), pool: null });
  const second = createApplication({ root: path.join(__dirname, '..'), pool: null });
  first.memoryStore.assignments.set('isolation', { requestId: 'isolation' });
  first.memoryStore.usersById.get('admin-default').name = 'Changed';
  assert.equal(second.memoryStore.assignments.has('isolation'), false);
  assert.equal(second.memoryStore.usersById.get('admin-default').name, 'Admin');
  const server = first.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const login = await fetch(`${base}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: 'maint5', password: '123' }) });
    assert.equal(login.status, 200);
    assert.equal(first.memoryStore.sessions.size, 1);
    assert.equal(second.memoryStore.sessions.size, 0);
    assert.equal((await fetch(`${base}/server-modules/application.js`)).status, 404);
    assert.equal((await fetch(`${base}/05-engineering-source/procurement-prototype/`)).status, 200);
    assert.equal((await fetch(`${base}/api/om/assignments`)).status, 401);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('calendar and tracking normalizers preserve blanks, aliases, and writable field limits', () => {
  const modulePath = path.join(__dirname, '../server-modules/om-models.js');
  assert.ok(fs.existsSync(modulePath), 'OM model module must exist');
  const { normalizeProjectStageCalendarRecord, normalizeOmProcurementTrackingRecord, sanitizeOmProcurementPatch } = require(modulePath);
  const calendar = normalizeProjectStageCalendarRecord({ year_project: ' P27 ', project_code: 'f27', phase_code: 'evt', line_open_date: '2026-09-10' });
  assert.equal(calendar.yearProject, 'P27');
  assert.equal(calendar.projectCode, 'F27');
  assert.equal(calendar.phase, 'EVT');
  assert.equal(calendar.lineOpenDate, '2026-09-10');
  assert.equal(normalizeOmProcurementTrackingRecord({ total_lead_time_days: null }).totalLeadTimeDays, '');
  assert.equal(normalizeOmProcurementTrackingRecord({ total_lead_time_days: 0 }).totalLeadTimeDays, 0);
  assert.deepEqual(sanitizeOmProcurementPatch({ prNo: 'PR-1', purpose: 'SMT', requestId: 'other' }), { prNo: 'PR-1' });
});

test('calendar repository preserves SQL bind order while service validates and audits the saved record', async () => {
  const modulePath = path.join(__dirname, '../server-modules/calendar-repository.js');
  assert.ok(fs.existsSync(modulePath), 'calendar persistence module must exist');
  const { createCalendarRepository } = require(modulePath);
  const { createCalendarService } = require('../server-modules/calendar-service');
  const { createMemoryStore } = require('../server-modules/memory-store');
  const calls = [];
  const pool = { async execute(sql, params) { calls.push({ sql, params }); return [[]]; } };
  const repository = createCalendarRepository({ pool });
  const events = [];
  const service = createCalendarService({ pool, memoryStore: createMemoryStore().memoryStore, ...repository, audit: async (...args) => events.push(args) });
  const actor = { id: 'om-leader-mai', name: 'Mai', role: 'omLeader' };
  await assert.rejects(service.saveProjectStageCalendarRecord({}, actor, { phase: 'evt' }), { status: 400 });
  assert.equal(calls.length, 0);
  const record = await service.saveProjectStageCalendarRecord({}, actor, { yearProject: ' P27 ', projectCode: 'f27', phase: 'evt', lineOpenDate: '2026-09-10' });
  assert.equal(record.updatedByUserId, 'om-leader-mai');
  assert.deepEqual(calls[0].params, ['P27', 'F27', 'EVT', '2026-09-10', 'om-leader-mai']);
  assert.match(calls[0].sql, /INSERT INTO om_project_stage_calendar/);
  assert.equal(events[0][0], 'om.project_stage_calendar_saved');
  assert.equal(events[0][2].entityId, 'P27::F27::EVT');
});

test('health uses the application pool and server close does not dispose the shared pool', async () => {
  const { createApplication } = require('../server-modules/application');
  let healthy = true;
  let ended = false;
  const statements = [];
  const pool = {
    async query(sql) { statements.push(sql); if (!healthy) throw new Error('offline'); return [[{ ok: 1 }]]; },
    async end() { ended = true; },
  };
  const app = createApplication({ pool });
  const server = app.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const url = `http://127.0.0.1:${server.address().port}/api/health`;
    const good = await fetch(url);
    assert.equal(good.status, 200);
    assert.deepEqual(await good.json(), { ok: true, db: 'mysql' });
    healthy = false;
    const bad = await fetch(url);
    assert.equal(bad.status, 503);
    assert.deepEqual(await bad.json(), { ok: false, db: 'mysql', error: 'Database health check failed' });
    assert.deepEqual(statements, ['SELECT 1 AS ok', 'SELECT 1 AS ok']);
  } finally { await new Promise(resolve => server.close(resolve)); }
  assert.equal(ended, false);
});
