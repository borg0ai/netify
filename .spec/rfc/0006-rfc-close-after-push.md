# RFC 0006: Require pushed work before closing RFCs

**Status:** Approved

## Summary

Netify must keep an RFC open until its implementation is committed and pushed to the intended remote branch. It must then commit and push the RFC's Implemented status and archive move before reporting the RFC closed.

## Problem

The workflow says not to commit or push unless the user requests it, but it lets agents advance an RFC to Implemented and archive it without checking Git state. That allowed RFC 0005 to look complete while its implementation existed only as local edits. Shipify then stopped on the dirty worktree, and the remote still lacked the fix.

## Goals

- Require an implementation commit on the authorized branch before advancing an RFC to Implemented.
- Push that commit to the intended remote and verify the remote branch points to it before archiving the RFC.
- Commit and push the RFC status and archive move, then verify the remote contains the closure record.
- If authorization, commit, push, or remote verification is missing or fails, leave the RFC open and report the exact incomplete stage.
- Preserve scoped staging and existing branch, worktree, and release rules.

## Non-goals

- Committing or pushing every task automatically.
- Creating branches, tags, GitHub releases, or package-channel updates without their separate authorization and workflow.
- Changing Specify's RFC format or status vocabulary.

## Design

Update the Netify workflow's close sequence. After checks pass, stage only the approved implementation files, commit them, push to the authorized target branch, and verify the remote ref. Only then advance the RFC to Implemented and archive it through Specify. Commit and push the resulting RFC status, path, roadmap, and task-tracking changes; verify the remote state before declaring closure. When the user has not authorized commit or push, keep the RFC Approved and open, and report that closure is waiting for authorization. A failed push or mismatched remote ref also leaves closure incomplete.

Update `plugins/netify/skills/netify-workflow/SKILL.md` and `plugins/netify/skills/netify-workflow/references/agent-routing.md`. Keep tags, releases, and package-channel publication as separate workflows.

## Acceptance

- Netify instructs agents not to mark or archive an RFC as Implemented before its implementation commit is pushed and verified on the intended remote branch.
- Netify requires the RFC closure changes themselves to be committed, pushed, and verified before it reports the RFC closed.
- Without user authorization for commit and push, Netify leaves the RFC open and reports the blocker.
- Push failure, remote mismatch, or unrelated worktree changes cannot be reported as a completed RFC closure.
- Tagging, releases, and channel publication remain separate from RFC closure.
