#!/usr/bin/env node
// PreToolUse hook. Blocks mutating actions until the current task has a
// skill-check table covering every capability in the repo's .netify.json.
// Task = everything after the latest user message. Inactive unless the netify
// skill was invoked in this session (RFC 0002). Exit 2 blocks; exit 0 allows.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export const DEFAULTS = ['Laurenify', 'Karpathify', 'Mattify', 'Specify', 'Designify', 'Birdify',
  'ReasonGraph', 'CodeGraph', 'Graphify', 'ReviewGraph', 'IssueGraph', 'netify-worktree-pr'];

const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit', 'apply_patch']);
const MUTATING_BASH = [
  /\bsed\s+(-[a-zA-Z]*i|--in-place)/, /\btee\b/, /\b(rm|mv|cp|mkdir|rmdir|touch|chmod|chown|ln)\s/,
  /(^|[^&0-9>])>>?\s*(?!\/dev\/null|&)\S/, /\bgit\s+(add|commit|push|merge|rebase|reset|checkout|switch|restore|clean|stash|cherry-pick|apply|tag|branch|worktree\s+(add|remove|prune))\b/,
  /\bgh\s+(pr|release|issue|repo)\s+(create|merge|edit|close|delete)\b/,
  /\b(npm|pnpm|yarn|bun)\s+(install|i|add|remove|uninstall|publish|link)\b/, /\bnpx\s+(-y\s+)?(skills|plugins)\s+(add|remove)\b/,
  /\b(pip3?|brew|cargo|go|gem)\s+install\b/, /\b\w+\s+init\b/,
];

export function isMutating(tool, input) {
  if (EDIT_TOOLS.has(tool)) return true;
  if (tool !== 'Bash') return false;
  const cmd = (input && input.command) || '';
  return MUTATING_BASH.some((re) => re.test(cmd));
}

function findConfig(cwd) {
  let d = resolve(cwd || process.cwd());
  for (;;) {
    if (existsSync(join(d, '.netify.json')) || existsSync(join(d, '.git'))) return join(d, '.netify.json');
    const up = dirname(d);
    if (up === d) return join(resolve(cwd || '.'), '.netify.json');
    d = up;
  }
}

function missingDefaults(list) {
  const have = new Set((list || []).map((n) => String(n).toLowerCase()));
  return DEFAULTS.filter((n) => !have.has(n.toLowerCase()));
}

function parseCaps(text) {
  try {
    const caps = JSON.parse(text).capabilities;
    return Array.isArray(caps) ? caps : null;
  } catch { return null; }
}

function isUserPrompt(o) {
  if (o.type !== 'user' || o.isMeta) return false;
  const c = o.message && o.message.content;
  if (typeof c === 'string') return c.trim().length > 0;
  return Array.isArray(c) && c.some((b) => b.type === 'text' && b.text && b.text.trim());
}

export function evaluate(input, fs = { readFileSync, existsSync }) {
  const tool = input.tool_name;
  const ti = input.tool_input || {};
  const cfgPath = findConfig(input.cwd);

  // Creating .netify.json is always allowed, but it must keep all defaults.
  if (EDIT_TOOLS.has(tool) && String(ti.file_path || '').endsWith('.netify.json') && typeof ti.content === 'string') {
    const caps = parseCaps(ti.content);
    const miss = caps ? missingDefaults(caps) : DEFAULTS;
    return miss.length
      ? { block: true, msg: `BLOCKED by netify: .netify.json must be {"capabilities": [...]} and keep all defaults. Missing: ${miss.join(', ')}. You may add capabilities, never remove one.` }
      : { block: false };
  }
  if (!isMutating(tool, ti)) return { block: false };

  const tp = input.transcript_path;
  if (!tp || !fs.existsSync(tp)) return { block: false };
  const lines = fs.readFileSync(tp, 'utf8').split('\n').filter(Boolean);
  let invoked = false, lastUser = -1;
  const asst = [];
  lines.forEach((l, i) => {
    let o; try { o = JSON.parse(l); } catch { return; }
    if (isUserPrompt(o)) lastUser = i;
    const c = o.message && o.message.content;
    if (o.type !== 'assistant' || !Array.isArray(c)) return;
    for (const b of c) {
      if (b.type === 'tool_use' && b.name === 'Skill' && /(^|:)netify(-workflow)?$/.test(b.input?.skill || '')) invoked = true;
      if (b.type === 'text') asst.push({ i, text: b.text });
    }
  });
  if (!invoked) return { block: false };

  if (!fs.existsSync(cfgPath)) {
    return { block: true, msg: `BLOCKED by netify: ${cfgPath} is missing. Create it with the Write tool as {"capabilities": [...]} containing all defaults (${DEFAULTS.join(', ')}). You may add capabilities, never remove one.` };
  }
  const caps = parseCaps(fs.readFileSync(cfgPath, 'utf8'));
  if (!caps) return { block: true, msg: `BLOCKED by netify: ${cfgPath} is not valid {"capabilities": [...]}. Fix it.` };
  const miss = missingDefaults(caps);
  if (miss.length) return { block: true, msg: `BLOCKED by netify: ${cfgPath} is missing default capabilities: ${miss.join(', ')}. Add them; never remove one.` };

  const ok = asst.filter((a) => a.i > lastUser).some(({ text }) => {
    const rows = text.split('\n');
    return caps.every((n) => {
      const hit = rows.filter((r) => r.toLowerCase().includes(String(n).toLowerCase()));
      return hit.some((r) => /\b(used|unavailable)\b/i.test(r)) && !hit.some((r) => /\bskipped\b/i.test(r));
    });
  });
  return ok ? { block: false } : {
    block: true,
    msg: `BLOCKED by netify: print this task's skill-check table before any edit or mutating command. One row per capability (${caps.join(', ')}), each "used (evidence)" or "unavailable (evidence)". "skipped" is not allowed. Each new user message needs a new table.`,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let input;
  try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { process.exit(0); }
  const r = evaluate(input);
  if (r.block) process.stderr.write(r.msg + '\n');
  process.exit(r.block ? 2 : 0);
}
