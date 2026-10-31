# Netify

Netify routes engineering work through focused skills, agent delegation, and evidence-based verification.

## Install

```bash
npx skills add borg0ai/netify --skill netify --agent codex --copy --yes
```

Install for every supported agent, user-level:

```bash
npx skills add borg0ai/netify --skill netify --agent '*' --global --copy --yes
```

Eve and PromptScript do not support global installs; install them per project without `--global`.

The skill only invokes capabilities available in the current agent environment. Install and configure companion skills, CLIs, or MCP integrations separately when needed.

## Enforced behavior

- Every task starts with a skill check: one row per capability (`used`, `skipped` with reason, or `unavailable` with evidence). No table, no implementation.
- Birdify and Graphify are required for design work and for multi-file, shared-signature, or architecture changes.
- ReasonGraph, CodeGraph, IssueGraph, ReviewGraph, and Graphify are initialized automatically when their CLI is installed but data is missing. Missing CLIs are reported, never installed.
