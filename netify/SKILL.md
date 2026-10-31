---
name: netify
description: Orchestrate feature work, bug fixes, refactors, and engineering tasks with focused skills and coding agents. Use when a task needs a coordinated workflow across planning, implementation, issue tracking, code graphs, architecture, design, or review.
license: MIT
metadata:
  version: "0.2.0"
---

# Netify

Route engineering work through the smallest useful set of skills and agents. Keep one accountable lead, one shared scope, and evidence for every completion claim.

Use for code or project work that benefits from routing among Laurenify, Karpathify, Mattify, ReasonGraph, CodeGraph, IssueGraph, ReviewGraph, Graphify, Designify, Birdify, or Specify. Every capability in [agent-routing.md](references/agent-routing.md) must be explicitly judged for every task; none may be skipped silently.

## Workflow

1. **Frame the task.** Read repository instructions and current status. State the requested outcome and observable done conditions. Distinguish facts from assumptions. Ask only about a missing choice that blocks safe progress.
2. **Skill check (mandatory gate).** Read `references/agent-routing.md`. Before any implementation, print a table with one row for every capability in its routing table: `used`, `skipped (reason tied to the Skip-allowed column)`, or `unavailable (evidence: command output or missing path)`. A capability marked **Required** may only be `used` or `unavailable`. No table, no implementation. A skill name is not proof the skill or its tools are available. Never invent commands, MCP tools, agent results, or repository history.
3. **Seed missing graphs (no approval needed).** For code work in a repository, check ReasonGraph (`.reasongraph/`), CodeGraph (`.codegraph/`), IssueGraph, ReviewGraph, and Graphify output. For each one whose CLI is installed but whose data is missing, run its init immediately without asking: `reasongraph init`, `codegraph init`, and the init command from IssueGraph's, ReviewGraph's and Graphify's CLI help. Report what was initialized. If a CLI is not installed, mark it `unavailable` in the skill check with evidence and tell the user how to install it; do not install it yourself and do not invent install commands. Never write tracker data or reconfigure agents as part of seeding.
4. **Recover project context.** For code changes, consult ReasonGraph before editing when available. For multi-session work, blockers, dependencies, or context recovery, use IssueGraph. Use CodeGraph and ReviewGraph only when their CLI/MCP integration is present; graph output narrows investigation but never replaces source and test inspection.
5. **Honor project gates.** For persistent engineering changes, use Specify to deliver and validate one focused RFC before implementation. Present the concrete plan and wait for explicit approval when the repository workflow requires it. If Specify is required but unavailable, stop before implementation and report the missing dependency. For design work and for code changes that touch more than one file, change a shared signature, or make an architecture choice, Birdify and Graphify are required: complete Birdify's rendered map and displayed change plan, query the Graphify graph, then wait for confirmation unless the user explicitly waived that gate for this task. Apply Designify's matching workflow without duplicating its RFC or creating a parallel plan.
6. **Choose agent shape.** Delegate only when agent tools exist and work can be separated by clear ownership. Use one lead to own scope, integration, and final verification. Give each worker a bounded task, exact files or output path, dependencies, acceptance criteria, and report format. Keep tightly coupled edits with one implementer. If delegation is unavailable or adds coordination cost, execute sequentially and say so.
7. **Implement in small units.** Use the selected debugging, design, or TDD method. Read relevant implementation and tests before editing. Preserve existing behavior and user changes. Do not expand scope based on neighboring issues or graph suggestions.
8. **Review and verify.** Reconcile worker changes, inspect the complete diff, run relevant project checks, and use ReviewGraph when available for graph-informed change review. Verify the requested behavior directly. Record important non-obvious decisions in ReasonGraph when available. Report exact checks and failures; never infer a pass.
9. **Close the loop.** Update IssueGraph tasks when used. Summarize changed areas, agent contributions, verification evidence, unresolved risks, and remaining work. Do not commit, push, merge, deploy, or publish unless requested or already authorized.

## Agent contract

- Lead agent owns the task outcome and all cross-worker integration.
- Workers do not edit the same files concurrently. If overlap becomes necessary, serialize ownership.
- Workers return changed paths, decisions, checks run with results, and unresolved questions. Lead independently inspects integrated changes.
- Parallelize independent investigation or implementation slices only. Do not spawn agents to imitate tools that are unavailable.
- Keep user-facing updates concise and factual. Surface blockers early; continue independent work while blocked where safe.

## Completion rule

Call work complete only when acceptance conditions are checked against the result. State which checks ran, which did not, and why. Packaging, a successful agent response, or a clean-looking diff alone does not prove behavior.
