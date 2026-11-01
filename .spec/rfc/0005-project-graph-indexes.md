# RFC 0005: Seed graph indexes in the active project repository

**Status:** Approved

## Summary

Treat CodeGraph, ReasonGraph, ReviewGraph, and IssueGraph indexes as project data. Initialize and query each index in the repository the agent is currently working on. Permit graph initialization there before the capability table is complete.

## Problem

The current workflow confuses an agent's tool installation repository with its active project repository. Graph indexes describe the active project, so requiring them in an external agent repository sends queries to the wrong codebase and makes missing indexes impossible to seed. The hook compounds this by blocking ordinary graph init commands unless they name an absolute path outside the project.

## Goals

- Scope all four graph indexes to the active project repository.
- Let each graph CLI initialize its index from the active project repository before the capability table is complete.
- Require graph capability evidence to identify the active project repository and show either an existing index or successful initialization there.
- Keep graph initialization distinct from IssueGraph tracker writes; initialization never authorizes creating or changing issues.
- Keep mutation detection limited to actual graph `init` commands.

## Non-goals

- Moving graph indexes into agent installation or source repositories.
- Changing graph query behavior, index formats, or tracker authorization.
- Automatically writing IssueGraph task records while seeding.

## Design

The repository containing `.netify.json` is Netify's project root. Agents run graph initialization and queries against that repository; tool installation location does not determine index ownership. The workflow documents each CLI's normal init command from the project root. The hook recognizes graph init as a bootstrap mutation and allows it before the skill-check table, without requiring an external path. Later capability rows must say `active project repository <path>` and provide index-present or init-succeeded evidence. The hook checks required wording only, consistent with its existing table-based evidence model.

Update the workflow skill, routing reference, hook, README, and hook tests. Remove external-agent-repository path parsing and the waiver that falsely attests external indexes.

## Acceptance

- All four graph capabilities initialize and query indexes in the active project repository.
- `reasongraph init` and the documented init commands for CodeGraph, ReviewGraph, and IssueGraph are allowed as bootstrap steps in that repository before the capability table.
- The hook no longer requires absolute paths to an external repository or external agent-owned-index evidence.
- The capability table records the active project repository and index presence or successful init for each graph.
- IssueGraph initialization does not authorize tracker writes.
- Unrelated read-only commands containing `init` remain unblocked.
