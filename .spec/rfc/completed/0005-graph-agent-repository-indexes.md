# RFC 0005: Initialize graph indexes in owning agent repositories

**Status:** Implemented

## Summary

Make CodeGraph, ReasonGraph, ReviewGraph, and IssueGraph resolve and initialize indexes in each tool's owning agent repository. Initialization is a required gate and cannot be skipped. Netify must not run graph initialization against the user's target repository merely because that repository lacks graph data.

## Problem

Netify's current skill and routing reference direct agents to initialize missing graph data in the active project. That creates indexes in the wrong repository and repeats the failure reported for CodeGraph. The same ownership ambiguity affects all four graph tools. GitHub issue #2 also records that generic `init` matching can block unrelated read-only commands, so enforcement must recognize only graph init commands.

## Goals

- Resolve each graph tool's agent-owned repository and index location before querying it.
- Initialize a missing index in that owning repository using the tool's documented command; initialization is mandatory when data is missing, and a missing/failed init blocks graph-dependent work.
- Apply the same ownership rule to CodeGraph, ReasonGraph, ReviewGraph, and IssueGraph.
- If a CLI is missing, install it through its documented installation route, then initialize it. If installation, repository resolution, or initialization fails, stop and report evidence; do not skip the graph or fall back to indexing the user's repository.

## Non-goals

- Changing graph query behavior or index formats.
- Installing tools or reconfiguring agent settings beyond existing Netify rules.
- Writing tracker data to IssueGraph without task authorization.

## Design

Update `plugins/netify/skills/netify-workflow/SKILL.md` and `plugins/netify/skills/netify-workflow/references/agent-routing.md` so graph checks identify the owning agent repository first and initialize only there. Update `plugins/netify/hooks/netify-skill-check.mjs` to reject skipped/unavailable graph-init evidence and limit init-command matching to the four graph CLIs. Update `README.md` to describe the mandatory agent-owned initialization gate. Keep source-of-truth and tracker-write boundaries intact.

## Acceptance

- All four graph entries state that index lookup and initialization target the owning agent repository, not the user's repository.
- Missing or unresolvable agent repository never causes initialization in the user's repository and blocks continuation past the graph gate.
- Missing data requires init success before graph-dependent work continues; missing tool or init failure blocks rather than becoming `skipped` or `unavailable`.
- Hook mutation detection recognizes the four graph CLIs' `init` commands without treating unrelated filenames or text containing `init` as graph initialization.
- Existing read-only fallback, source-of-truth, and IssueGraph write-authorization rules remain explicit.
- Validate RFC and run focused repository checks after implementation.
