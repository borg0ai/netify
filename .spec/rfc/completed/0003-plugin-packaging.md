# RFC 0003: Netify plugin packaging and install (child of 0001)

**Status:** Implemented

**Parent:** [0001](0001-netify-plugin.md)

## Summary

Package netify as one plugin at `plugins/netify/` with three manifests sharing one `skills/` and one `hooks/`, installable with `npx @borg0ai/plugins add borg0ai/netify`.

## Problem

Skills and hook live at the repo root and cannot be installed together into another repo or agent.

## Goals

- Plugin root `plugins/netify/` holds `.plugin/plugin.json`, `.claude-plugin/`, `.codex-plugin/`, one `skills/`, one `hooks/`, `LICENSE`.
- `npx @borg0ai/plugins discover` lists the plugin, both skills and the hook.
- Skills stay installable alone with `npx skills add`.
- The duplicate global hook in `~/.claude/settings.json` is removed after the plugin is installed.

## Non-goals

Host-specific content copies. Plugins for agents beyond Claude Code and Codex.

## Design

Move `skills/` and `hooks/` under `plugins/netify/`. Manifests are the only duplicated files and carry the same version. Hook command path uses the plugin-root variable each host provides. Native entry points (added at the user's request): repo-root `.claude-plugin/marketplace.json` with `source: ./plugins/netify`, and repo-root `.codex-plugin/plugin.json` whose `skills` and `hooks` point into `plugins/netify/`; Codex uses `hooks/codex-hooks.json` because its plugin root is the repo root. Open verifications, recorded as acceptance conditions: whether `@borg0ai/plugins` translates hooks for Claude Code and for Codex; whether Codex has an equivalent PreToolUse hook. If either is false, disclose it in README and ship prompt-only enforcement there.

## Acceptance

`npx @borg0ai/plugins discover plugins/netify` and the GitHub form show plugin, skills and hook. `npx skills add . --list` finds both skills. Install to a scratch Claude Code project and observe the hook block an edit without a table. Report Codex hook support with command output.
