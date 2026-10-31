# RFC 0004: Netify skill rules and renames (child of 0001)

**Status:** Implemented

**Parent:** [0001](0001-netify-plugin.md)

## Summary

Rename the skills to `netify-workflow` and `netify-worktree-pr`, make every capability mandatory with no size-based skip, make missing tools installed rather than only reported, and release 0.3.0.

## Problem

Names are inconsistent (`netify` vs `netify-workflow`), the rules still allow skipping by task size, and install behavior was split between skills.

## Goals

- Skill folder, `name`, `skillId` and update URL match for both skills.
- No `skipped` status and no size judgement by the agent; `netify-worktree-pr` keeps its ask-first gate.
- Missing CLIs/skills are installed from official docs; unknown sources stop and ask.
- Step order: first table, then install and init, then updated table.
- All parts at version 0.3.0, one tag `v0.3.0`.

## Non-goals

Hook logic (0002). Packaging (0003).

## Design

Edit `SKILL.md` and `references/agent-routing.md` of both skills; read the required list from `.netify.json`. README documents the new names and install commands. Old `netify` and `netify-worktree` installs are removed with `npx skills remove <name> --global`, never `--all`.

## Acceptance

Validator passes for both skills. `npx skills add . --list` shows the new names. README install lines work. Stale old names are absent from `~/.claude/skills`.
