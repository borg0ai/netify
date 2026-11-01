#!/usr/bin/env node
// PreToolUse hook. Blocks mutating actions until the current task has a
// skill-check table covering every capability in the repo's .netify.json.
// Task = everything after the latest user message. Inactive unless the netify
// skill was invoked in this session (RFC 0002). Exit 2 blocks; exit 0 allows.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export const DEFAULTS = ['Laurenify', 'Karpathify', 'Mattify', 'Specify', 'Designify', 'Birdify',
  'ReasonGraph', 'CodeGraph', 'Graphify', 'ReviewGraph', 'IssueGraph', 'netify-worktree-pr'];
const REQUIRED_GRAPH_INIT = ['CodeGraph', 'IssueGraph', 'ReasonGraph', 'ReviewGraph'];
const TABLE_WAIVER = /NETIFY-WAIVE-SKILL-CHECK:\s*all four graph indexes are present in the active project repository/i;

const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit', 'apply_patch']);
const MUTATING_BASH = [
  /\bsed\s+(-[a-zA-Z]*i|--in-place)/, /\btee\b/, /\b(rm|mv|cp|mkdir|rmdir|touch|chmod|chown|ln)\s/,
  /\bgit\s+(add|commit|push|merge|rebase|reset|checkout|switch|restore|clean|stash|cherry-pick|apply|tag|branch|worktree\s+(add|remove|prune))\b/,
  /\bgh\s+(pr|release|issue|repo)\s+(create|merge|edit|close|delete)\b/,
  /\b(npm|pnpm|yarn|bun)\s+(install|i|add|remove|uninstall|publish|link)\b/, /\bnpx\s+(-y\s+)?(skills|plugins)\s+(add|remove)\b/,
  /\b(pip3?|brew|cargo|go|gem)\s+install\b/,
  /(?:^|&&|;)\s*(?:rtk\s+)?(?:codegraph|issuegraph|reasongraph|reviewgraph|graphify)\s+init\b/,
  /(?:^|&&|;)\s*(?:rtk\s+)?issuegraph\s+-C\s+\S+\s+init\b/,
];

export function isMutating(tool, input) {
  if (EDIT_TOOLS.has(tool)) return true;
  if (tool !== 'Bash') return false;
  const cmd = (input && input.command) || '';
  return hasFileRedirection(cmd) || MUTATING_BASH.some((re) => re.test(cmd));
}

function hasFileRedirection(command) {
  let quote = '';
  let escaped = false;
  for (let i = 0; i < command.length; i += 1) {
    const char = command[i];
    if (escaped) { escaped = false; continue; }
    if (char === '\\' && quote !== "'") { escaped = true; continue; }
    if (quote) { if (char === quote) quote = ''; continue; }
    if (char === "'" || char === '"' || char === '`') { quote = char; continue; }
    if (char !== '>' || command[i - 1] === '=' || command[i + 1] === '&') continue;

    let targetAt = i + (command[i + 1] === '>' ? 2 : 1);
    while (/\s/.test(command[targetAt] || '')) targetAt += 1;
    const target = command.slice(targetAt).match(/^("[^"]*"|'[^']*'|[^\s;&|]+)/)?.[0] || '';
    if (target.replace(/^['"]|['"]$/g, '') !== '/dev/null') return true;
    i = targetAt + target.length - 1;
  }
  return false;
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

function collectStrings(value, output = []) {
  if (typeof value === 'string') output.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, output));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectStrings(item, output));
  return output;
}

function userText(event) {
  const content = event.message?.content;
  return typeof content === 'string' ? content : collectStrings(content).join('\n');
}

function capabilityRows(text, capabilities) {
  const rows = [];
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim().replace(/^[-*]\s+/, '');
    const cells = line.split('|').map((cell) => cell.trim()).filter(Boolean);
    const tableName = capabilities.find((name) => cells[0]?.toLowerCase() === name.toLowerCase());
    if (tableName && cells.length > 1) rows.push([tableName, cells.slice(1).join(' | ')]);
    if (tableName) continue;

    for (const name of capabilities) {
      if (!line.toLowerCase().startsWith(name.toLowerCase())) continue;
      const suffix = line.slice(name.length);
      if (!/^(?:\s+|\s*[:|—–-])/.test(suffix)) continue;
      rows.push([name, suffix.replace(/^\s*[:|—–-]?\s*/, '')]);
      break;
    }
  }
  return rows;
}

function hasCapabilityEvidence(rows, capability) {
  const matching = rows.filter(([name]) => name.toLowerCase() === capability.toLowerCase());
  return matching.some(([, evidence]) => /\b(?:used|unavailable)\b/i.test(evidence))
    && !matching.some(([, evidence]) => /\bskipped\b/i.test(evidence));
}

function hasGraphIndexEvidence(rows, capability) {
  const matching = rows.filter(([name]) => name.toLowerCase() === capability.toLowerCase());
  return matching.some(([, evidence]) => /\bused\b/i.test(evidence)
    && /active project repository/i.test(evidence)
    && (/(?:\binit\b.*(?:success|succeed|pass|creat)|\bindex\b.*(?:present|ready|available))/i.test(evidence))
  ) && !matching.some(([, evidence]) => /\bskipped\b/i.test(evidence));
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

  // Graph indexes seed the active project, so init must run before its table
  // can cite the resulting index.
  const graphInit = tool === 'Bash' && (
    /(?:^|&&|;)\s*(?:rtk\s+)?(?:codegraph|graphify|issuegraph|reasongraph|reviewgraph)\s+init\b/.test(ti.command || '')
    || /(?:^|&&|;)\s*(?:rtk\s+)?issuegraph\s+-C\s+\S+\s+init\b/.test(ti.command || ''));
  if (graphInit) return { block: false };

  const tp = input.transcript_path;
  if (!tp || !fs.existsSync(tp)) return { block: false };
  const lines = fs.readFileSync(tp, 'utf8').split('\n').filter(Boolean);
  let invoked = false, lastUser = -1, waived = false;
  const asst = [];
  lines.forEach((l, i) => {
    let o; try { o = JSON.parse(l); } catch { return; }
    if (isUserPrompt(o)) {
      lastUser = i;
      waived = TABLE_WAIVER.test(userText(o));
    }
    const c = o.message?.content;
    if (o.type !== 'assistant') return;
    if (Array.isArray(c)) {
      for (const b of c) {
        if (b.type === 'tool_use' && b.name === 'Skill' && /(^|:)netify(-workflow)?$/.test(b.input?.skill || '')) invoked = true;
      }
    }
    const strings = collectStrings(c);
    if (strings.length) asst.push({ i, text: strings.join('\n'), blockCount: Array.isArray(c) ? c.length : 1 });
  });
  if (!invoked) return { block: false };

  if (!fs.existsSync(cfgPath)) {
    return { block: true, msg: `BLOCKED by netify: ${cfgPath} is missing. Create it with the Write tool as {"capabilities": [...]} containing all defaults (${DEFAULTS.join(', ')}). You may add capabilities, never remove one.` };
  }
  const caps = parseCaps(fs.readFileSync(cfgPath, 'utf8'));
  if (!caps) return { block: true, msg: `BLOCKED by netify: ${cfgPath} is not valid {"capabilities": [...]}. Fix it.` };
  const miss = missingDefaults(caps);
  if (miss.length) return { block: true, msg: `BLOCKED by netify: ${cfgPath} is missing default capabilities: ${miss.join(', ')}. Add them; never remove one.` };

  const currentText = asst.filter((a) => a.i > lastUser);
  const rows = capabilityRows(currentText.map(({ text }) => text).join('\n'), caps);
  const scannedBlocks = currentText.reduce((total, item) => total + item.blockCount, 0);
  const missing = caps.filter((name) => !hasCapabilityEvidence(rows, name));
  const configured = new Set(caps.map((name) => String(name).toLowerCase()));
  const missingInit = waived ? [] : REQUIRED_GRAPH_INIT.filter((name) => configured.has(name.toLowerCase())
    && !hasGraphIndexEvidence(rows, name));
  const ok = (waived || missing.length === 0) && missingInit.length === 0;
  return ok ? { block: false } : {
    block: true,
    msg: `BLOCKED by netify: complete the current task's capability table before editing. Missing evidence: ${[...missing, ...missingInit].join(', ')}. Recorded assistant messages with content: ${currentText.length}; content blocks scanned: ${scannedBlocks}. If transcript omitted the table, use exact user waiver: "NETIFY-WAIVE-SKILL-CHECK: all four graph indexes are present in the active project repository".`,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let input;
  try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { process.exit(0); }
  const r = evaluate(input);
  if (r.block) process.stderr.write(r.msg + '\n');
  process.exit(r.block ? 2 : 0);
}
