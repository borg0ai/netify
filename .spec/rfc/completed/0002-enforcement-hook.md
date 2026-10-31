# RFC 0002: Netify enforcement hook and .netify.json (child of 0001)

**Status:** Implemented

**Parent:** [0001](0001-netify-plugin.md)

## Summary

A PreToolUse hook blocks mutating actions until the current task has a skill-check table covering every required capability. The required list comes from a per-repo `.netify.json`.

## Problem

The rule that every capability must be used is a prompt, so a model can ignore it unobserved. The existing global hook checks once per session, not per task, and only guards file-edit tools.

## Goals

- Each new user message starts a new task; the hook requires a fresh table after that message before any mutating action.
- Required list is read from `.netify.json` at the repo root; table, routing and hook share it.
- Missing `.netify.json`: block mutating actions and instruct the agent to create it with all 12 defaults (Laurenify, Karpathify, Mattify, Specify, Designify, Birdify, ReasonGraph, CodeGraph, Graphify, ReviewGraph, IssueGraph, netify-worktree); additions only, no removals; creating that file is allowed.
- Blocked: Edit, Write, MultiEdit, NotebookEdit, plus Bash commands matching a fixed mutating-pattern list (file writes, `sed -i`, git commit/push, gh pr create, package installs).
- Order with no exceptions: first table may mark missing items `unavailable (installing next)`; after it, installs and inits run; an updated table follows.

## Non-goals

Verifying evidence content. Enforcement outside Claude Code unless Codex proves an equivalent hook. Blocking read-only Bash.

## Design

Node script in `plugins/netify/hooks/`. Reads stdin JSON (`transcript_path`, `tool_name`, `tool_input`). Finds the last user message in the transcript, then looks for an assistant text block after it where every required name has a line marked `used` or `unavailable` and none marked `skipped`. Inactive when the netify skill was not invoked in the session. Exit 2 with stderr message to block. Config schema: `{"capabilities": ["Name", ...]}`. Supersedes `hooks/netify-skill-check.mjs`, which checks once per session.

## Acceptance

Synthetic-transcript tests pass for: no netify; netify without table; complete table; table with `skipped`; table before the latest user message; missing `.netify.json`; `.netify.json` missing a default capability; mutating vs read-only Bash. Recorded limitation: wording only, not evidence.
