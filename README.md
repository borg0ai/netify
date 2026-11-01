# Netify

Netify runs every listed skill and graph on every engineering task, coordinated by agents, with evidence for each completion claim. A hook enforces it.

Release `0.3.1` fixes transcript capability evidence detection, including assistant tool-call messages, and avoids false mutation blocks for filenames such as `init.go`.

## What is in the plugin

| Part | Purpose |
|---|---|
| `netify-workflow` | Orchestrates each task: capability evidence, mandatory agent-owned graph-index checks and initialization, delegation, verification |
| `netify-worktree-pr` | Isolated worktree: ask first, then commit, push, open a PR, remove the worktree |
| `hooks/netify-skill-check.mjs` | PreToolUse hook that blocks edits and mutating commands until the current task has a complete skill-check table |

All parts share one version.

## Install

Claude Code, native (skills and hook):

```
/plugin install netify --marketplace borg0ai/netify
```

Claude Code and Codex through the installer (skills and hook):

```bash
npx @borg0ai/plugins add borg0ai/netify
```

Codex native: the repo root has `.codex-plugin/plugin.json` pointing at `plugins/netify/`. I have not verified a native Codex install command; use the installer above.

Skills only, any agent (no hook, so the rules are prompt-only there):

```bash
npx skills add borg0ai/netify --skill '*' --agent '*' --global --copy --yes
```

Eve and PromptScript do not support global installs; install them per project without `--global`.

## Configure

Each repository declares its required capabilities in `.netify.json` at the repo root:

```json
{ "capabilities": ["Laurenify", "Karpathify", "Mattify", "Specify", "Designify", "Birdify",
  "ReasonGraph", "CodeGraph", "Graphify", "ReviewGraph", "IssueGraph", "netify-worktree-pr"] }
```

You may add capabilities, never remove one of these 12 defaults. If the file is missing, the hook asks the agent to create it.

## How enforcement works

- Each new user message is a new task and needs its own table: one row per capability, marked `used (evidence)` or `unavailable (evidence)`. `skipped` is not allowed.
- Until that table exists, the hook blocks Edit, Write, MultiEdit, NotebookEdit and Bash commands that write, commit, push, open PRs, or install.
- CodeGraph, IssueGraph, ReasonGraph, and ReviewGraph cannot pass as unavailable or skipped when their agent-owned index is missing. Initialize it in the owning agent repository; never initialize it in the user's target repository.
- The first table may mark missing tools `unavailable (not installed, installing next)`. After it, the agent installs them and prints an updated table.
- A worktree or branch is never created without your approval.

## Limits

- The hook checks the table wording, not the evidence behind it.
- It is inactive until the `netify-workflow` skill is invoked in the session.
- The Bash check is a fixed pattern list, not a shell parser; unusual commands can slip through.
- Hooks run in Claude Code. Whether Codex runs the same PreToolUse hook is not verified; treat Codex as prompt-only until it is.

## Development

```bash
node --test tests/
npx @borg0ai/plugins discover ./plugins/netify
npx skills add . --list
```

Root `.claude-plugin/` and `.codex-plugin/` are the native entry points; the plugin itself lives in `plugins/netify/`.

Design and decisions: `.spec/rfc/0001-netify-plugin.md`.
