import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { evaluate, DEFAULTS } from '../plugins/netify/hooks/netify-skill-check.mjs';

const user = (t) => ({ type: 'user', message: { content: t } });
const text = (t) => ({ type: 'assistant', message: { content: [{ type: 'text', text: t }] } });
const skill = { type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Skill', input: { skill: 'netify-workflow' } }] } };
const graphCaps = new Set(['CodeGraph', 'IssueGraph', 'ReasonGraph', 'ReviewGraph']);
const table = (caps, bad) => caps.map((c) => `| ${c} | ${c === bad ? 'skipped (small)' : graphCaps.has(c) ? 'used (evidence: active project repository /repo; index present)' : 'used (ran)'} |`).join('\n');

function setup({ config, events }) {
  const d = mkdtempSync(join(tmpdir(), 'netify-'));
  mkdirSync(join(d, '.git'));
  if (config) writeFileSync(join(d, '.netify.json'), JSON.stringify({ capabilities: config }));
  const tp = join(d, 't.jsonl');
  writeFileSync(tp, events.map((e) => JSON.stringify(e)).join('\n') + '\n');
  return { cwd: d, transcript_path: tp };
}
const edit = (s) => ({ ...s, tool_name: 'Edit', tool_input: { file_path: '/x/a.txt' } });

test('netify not invoked: allow', () => {
  const s = setup({ config: DEFAULTS, events: [user('hi'), text('ok')] });
  assert.equal(evaluate(edit(s)).block, false);
});
test('invoked, no table: block', () => {
  const s = setup({ config: DEFAULTS, events: [user('hi'), skill, text('starting')] });
  assert.equal(evaluate(edit(s)).block, true);
});
test('complete table: allow', () => {
  const s = setup({ config: DEFAULTS, events: [user('hi'), skill, text(table(DEFAULTS))] });
  assert.equal(evaluate(edit(s)).block, false);
});
test('table in thinking block beside tool call counts as assistant evidence', () => {
  const message = { type: 'assistant', message: { content: [
    { type: 'thinking', thinking: table(DEFAULTS) },
    { type: 'tool_use', name: 'Edit', input: { file_path: '/x/a.txt' } },
  ] } };
  const s = setup({ config: DEFAULTS, events: [user('hi'), skill, message] });
  assert.equal(evaluate(edit(s)).block, false);
});
test('plain capability list counts as evidence', () => {
  const plain = DEFAULTS.map((cap) => `${cap}: ${graphCaps.has(cap) ? 'used in active project repository /repo; index present' : 'used'}`).join('\n');
  const s = setup({ config: DEFAULTS, events: [user('hi'), skill, text(plain)] });
  assert.equal(evaluate(edit(s)).block, false);
});
test('explicit user waiver attests existing project indexes for current task', () => {
  const s = setup({ config: DEFAULTS, events: [user('NETIFY-WAIVE-SKILL-CHECK: all four graph indexes are present in the active project repository'), skill] });
  assert.equal(evaluate(edit(s)).block, false);
});
test('table with skipped: block', () => {
  const s = setup({ config: DEFAULTS, events: [user('hi'), skill, text(table(DEFAULTS, 'Birdify'))] });
  assert.equal(evaluate(edit(s)).block, true);
});
test('table before latest user message: block (new task needs new table)', () => {
  const s = setup({ config: DEFAULTS, events: [user('a'), skill, text(table(DEFAULTS)), user('next task'), text('go')] });
  assert.equal(evaluate(edit(s)).block, true);
});
test('missing .netify.json: block', () => {
  const s = setup({ events: [user('hi'), skill, text(table(DEFAULTS))] });
  assert.match(evaluate(edit(s)).msg, /missing/);
});
test('.netify.json missing a default: block', () => {
  const s = setup({ config: DEFAULTS.slice(1), events: [user('hi'), skill, text(table(DEFAULTS))] });
  assert.match(evaluate(edit(s)).msg, /Laurenify/);
});
test('writing .netify.json with all defaults: allow even without table', () => {
  const s = setup({ events: [user('hi'), skill] });
  const content = JSON.stringify({ capabilities: [...DEFAULTS, 'Extra'] });
  assert.equal(evaluate({ ...s, tool_name: 'Write', tool_input: { file_path: `${s.cwd}/.netify.json`, content } }).block, false);
});
test('writing .netify.json that drops a default: block', () => {
  const s = setup({ events: [user('hi'), skill] });
  const content = JSON.stringify({ capabilities: DEFAULTS.slice(1) });
  assert.equal(evaluate({ ...s, tool_name: 'Write', tool_input: { file_path: `${s.cwd}/.netify.json`, content } }).block, true);
});
test('read-only Bash allowed, mutating Bash blocked', () => {
  const s = setup({ config: DEFAULTS, events: [user('hi'), skill, text('no table')] });
  const bash = (command) => evaluate({ ...s, tool_name: 'Bash', tool_input: { command } }).block;
  for (const c of ['ls -la', 'git status', 'git log --oneline', 'cat a | grep b 2>&1', 'echo hi > /dev/null', 'codegraph init', 'reasongraph init', 'issuegraph init', 'issuegraph -C /repo init']) assert.equal(bash(c), false, c);
  for (const c of ['sed -i s/a/b/ f', 'git commit -m x', 'git push', 'gh pr create --title x', 'npm install -g foo', 'echo hi > out.txt', 'npx skills add a/b']) assert.equal(bash(c), true, c);
});
test('init filenames, arrows, and placeholder text do not look like mutations', () => {
  const s = setup({ config: DEFAULTS, events: [user('hi'), skill, text('no table')] });
  const bash = (command) => evaluate({ ...s, tool_name: 'Bash', tool_input: { command } }).block;
  for (const c of ['rg init.go src/foo.go', 'node -e "const f = x => x"', 'echo "<session>"']) assert.equal(bash(c), false, c);
});
