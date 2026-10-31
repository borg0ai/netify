---
name: netify-workflow
description: Orchestrate feature work, bug fixes, refactors, and engineering tasks with focused skills and coding agents. Use when a task needs a coordinated workflow across planning, implementation, issue tracking, code graphs, architecture, design, or review.
license: MIT
metadata:
  version: "0.3.0"
---

# Netify

Run every skill and graph listed in `.netify.json` on every engineering task, coordinated by agents. Keep one accountable lead, one shared scope, and evidence for every completion claim.

Use for code or project work that benefits from routing among Laurenify, Karpathify, Mattify, ReasonGraph, CodeGraph, IssueGraph, ReviewGraph, Graphify, Designify, Birdify, or Specify. Every capability in [agent-routing.md](references/agent-routing.md) must be used on every task. None may be skipped.

## Workflow

1. **Frame the task.** Read repository instructions and current status. State the requested outcome and observable done conditions. Distinguish facts from assumptions. Ask only about a missing choice that blocks safe progress.
2. **Skill check (mandatory gate, every task).** Each new user message is a new task and needs its own table. Read the repository's `.netify.json` (`{"capabilities": ["Name", ...]}`) and `references/agent-routing.md`. If `.netify.json` is missing, create it first: it must list all 12 defaults (Laurenify, Karpathify, Mattify, Specify, Designify, Birdify, ReasonGraph, CodeGraph, Graphify, ReviewGraph, IssueGraph, netify-worktree-pr); you may add capabilities, never remove one. Then print a table with one row for every capability in `.netify.json`. Each row is `used (evidence: what was loaded or run and what it returned)` or `unavailable (evidence: command output or missing path)`. `skipped` is not allowed for any capability, and you never judge a task too small to need a capability. "Used" means the capability's own instructions were loaded and its workflow ran at a depth proportionate to the task, with its output cited. `netify-worktree-pr` is `used` when its ask-first gate ran; it creates nothing without approval. The enforcement hook blocks edits and mutating commands until this table exists. A skill name is not proof the skill or its tools are available. Never invent commands, MCP tools, agent results, or repository history.
3. **Install and seed (no approval needed).** The first table may mark a missing capability `unavailable (not installed, installing next)`. After the table, install every missing CLI or skill: find the official install command in the tool's own README, `--help`, or package page, run it, and verify with `--version` or a listing. Install a missing skill with `npx skills add <owner/repo> --skill <name> --global --copy --yes` once its source is known from its docs. Never guess an install command or source; if none can be found, stop and ask the user for it. Then initialize each graph whose data is missing (ReasonGraph `.reasongraph/`, CodeGraph `.codegraph/`, IssueGraph, ReviewGraph, Graphify): `reasongraph init`, `codegraph init`, and the init command from the other CLIs' help. Report every install and init with its command output, then print an updated table. If an install fails, keep the row `unavailable` with the error as evidence. Never write tracker data or reconfigure agent settings while seeding.
4. **Recover project context.** For code changes, consult ReasonGraph before editing when available. For multi-session work, blockers, dependencies, or context recovery, use IssueGraph. Use CodeGraph and ReviewGraph only when their CLI/MCP integration is present; graph output narrows investigation but never replaces source and test inspection.
5. **Honor project gates.** For persistent engineering changes, use Specify to deliver and validate one focused RFC before implementation. Present the concrete plan and wait for explicit approval when the repository workflow requires it. If Specify is required but unavailable, stop before implementation and report the missing dependency. For design work and for code changes that touch more than one file, change a shared signature, or make an architecture choice, Birdify and Graphify are required: complete Birdify's rendered map and displayed change plan, query the Graphify graph, then wait for confirmation unless the user explicitly waived that gate for this task. Apply Designify's matching workflow without duplicating its RFC or creating a parallel plan.
6. **Choose agent shape.** Delegate only when agent tools exist and work can be separated by clear ownership. Use one lead to own scope, integration, and final verification. Give each worker a bounded task, exact files or output path, dependencies, acceptance criteria, and report format. Keep tightly coupled edits with one implementer. If delegation is unavailable or adds coordination cost, execute sequentially and say so.
7. **Implement in small units.** Use the selected debugging, design, or TDD method. Read relevant implementation and tests before editing. Preserve existing behavior and user changes. Do not expand scope based on neighboring issues or graph suggestions.
8. **Review and verify.** Reconcile worker changes, inspect the complete diff, run relevant project checks, and use ReviewGraph when available for graph-informed change review. Verify the requested behavior directly. Record important non-obvious decisions in ReasonGraph when available. Report exact checks and failures; never infer a pass.
9. **Close the loop.** Update IssueGraph tasks when used. Summarize changed areas, agent contributions, verification evidence, unresolved risks, and remaining work. Do not commit, push, merge, deploy, or publish unless requested or already authorized.

## Worktree and branch rule

Use the `netify-worktree-pr` skill for every worktree or branch. Never create a worktree or branch without explicit user approval; work in the current checkout by default. Delegated workers must not create them. When approved, `netify-worktree-pr` governs: work is done only when committed, pushed, the PR URL is reported, the worktree is removed, and `git worktree list` is reported. If `netify-worktree-pr` is not installed, mark it `unavailable` in the skill check and do not create a worktree or branch.

## Agent contract

- Lead agent owns the task outcome and all cross-worker integration.
- Workers do not edit the same files concurrently. If overlap becomes necessary, serialize ownership.
- Workers return changed paths, decisions, checks run with results, and unresolved questions. Lead independently inspects integrated changes.
- Parallelize independent investigation or implementation slices only. Do not spawn agents to imitate tools that are unavailable.
- Keep user-facing updates concise and factual. Surface blockers early; continue independent work while blocked where safe.

## Completion rule

Call work complete only when acceptance conditions are checked against the result. If a worktree or branch was approved, the `netify-worktree-pr` done criteria (PR opened, worktree removed) are part of the acceptance conditions. State which checks ran, which did not, and why. Packaging, a successful agent response, or a clean-looking diff alone does not prove behavior.
