# Agent and skill routing

Judge every row below on every task and record the verdict in the SKILL.md step 2 table. Load each used skill's own instructions before following its workflow. **Required** rows cannot be skipped, only `unavailable` with evidence. These tools evolve; their installed instructions and current CLI help outrank this routing summary.

| Capability | Route when | Boundary |
|---|---|---|
| Laurenify | Need disciplined investigation, architecture, TDD, review, or independent agent swarm | Pick one focused skill such as `how`, `architect`, `tdd`, `thermo-nuclear-code-quality-review`, or `swarm`. Follow that skill's platform mapping and agent protocol. Do not invoke a swarm for serial or tightly coupled work. |
| Karpathify | Need assumption control, minimal implementation, surgical edits, or measurable done conditions | Apply its Think Before Coding, Simplicity First, Surgical Changes, and Goal-Driven Execution principles. Use matching installed skills such as `methodology`, `agentic-engineering`, `minimalism`, or `diagnosing-bugs`. |
| Mattify | Need engineering method for debugging, TDD, or forming a precise spec | Prefer `diagnosing-bugs`, `tdd`, or `to-spec` from `skills/engineering`. Keep its method small and composable; do not let it bypass repository RFC gates. |
| Specify | Any persistent engineering change in an RFC-governed workflow; required by Netify for persistent code changes | Deliver and validate one concern before implementation. Use Specify CLI for lifecycle changes. Wait for required approval. Do not hand-edit its managed index or tracking files when a CLI command exists. |
| netify-worktree | User asks for a worktree or branch, or work is risky, exploratory, or parallel to uncommitted changes. Skip-allowed for single-file edits, docs, and small fixes | Use the `netify-worktree` skill. Ask first, then: work, commit, push, open PR, remove worktree, report `git worktree list`. Never create a worktree or branch without approval. |
| Designify | Work governed by Designify's RFC and task workflow, including approved feature implementation, debugging, and verification | Read `designify` plus the matching workflow reference. RFC is the plan; TDD is implementation method, not another approval route. |
| Birdify | **Required** for design work and for code changes touching >1 file, a shared signature, or an architecture choice. Also when the user asks for a map or project instructions configure auto mode. Skip-allowed only for a contained one-file change with an obvious test | Follow its constraint discovery, map rendering and visual review. For code work, show the rendered change plan and wait for approval unless the user explicitly waived that gate for this task. |
| ReasonGraph | Before code changes to retrieve prior decisions; after a consequential non-obvious decision | Run the installed ReasonGraph context/sync workflow. If `.reasongraph/` is missing and the CLI is installed, run `reasongraph init` without asking. If unavailable, inspect `.reasongraph/why/` directly; never claim a decision was recorded without evidence. |
| CodeGraph | Semantic code navigation is useful and its CLI/MCP is already installed | Use its connected MCP tools or documented CLI. Its index is navigation aid, not source-of-truth. If the CLI is installed but `.codegraph/` is missing, run `codegraph init` without asking. Do not install or reconfigure agents as an incidental task. |
| Graphify | **Required** for design work and for code changes touching >1 file, a shared signature, or an architecture choice. Skip-allowed only for a contained one-file change | Load the `graphify` skill; build or refresh the knowledge graph if missing (init needs no approval), then query it before editing. Graph output narrows investigation; source and tests stay the source of truth. |
| ReviewGraph | Need graph-informed bug tracing, impact analysis, or change review and MCP tools are connected | For debug/review skills, fetch minimal context first, use targeted graph queries, then inspect source/tests. If the CLI is installed but its data is missing, run its documented init without asking. If MCP/CLI is absent, mark `unavailable` with evidence, continue with repository tools and disclose. |
| IssueGraph | Work spans sessions, has dependencies/blockers, or needs recovery after context loss | Check `prime`/`ready` guidance, claim and update tasks using its CLI. If the CLI is installed but the tracker is unseeded, run its documented init command without asking. Do not write tracker data unless the user's task authorizes it. |

## Default sequence

For a normal code change, use this order and omit inapplicable steps:

0. **Skill check:** print the capability table (SKILL.md step 2) and seed missing graphs.
1. **Understand:** repository instructions and status; ReasonGraph context; targeted CodeGraph or ReviewGraph navigation when available; inspect source and tests.
2. **Specify:** deliver and validate a single RFC; include acceptance conditions and task-level implementation steps in the repository's prescribed location.
3. **Review scope:** Birdify and Graphify are required for design and multi-file/architecture changes; if Designify applies, follow its rendered plan and approval gates. Do not create duplicate plans.
4. **Implement:** use Mattify or Laurenify debugging/TDD method selected for the problem. Split work across agents only at independent ownership boundaries.
5. **Check:** run relevant tests and project checks; inspect integrated diff; ask ReviewGraph for risk/impact when available; fix verified issues.
6. **Worktree/branch (only if approved):** use `netify-worktree`; PR opened and worktree removed before closing.
7. **Record and close:** sync meaningful rationale to ReasonGraph; update IssueGraph if used; advance/archive RFC through Specify where required.

## Task sizing

- **Small, one-file fix:** one lead; use focused debugging/TDD guidance. Skip swarm. Follow mandatory project RFC and active Birdify gates.
- **Feature with separable modules:** one lead plus workers with non-overlapping ownership. Keep RFC approval and integration with lead.
- **Cross-cutting or multi-session work:** use IssueGraph dependencies; use Designify workflow if configured; delegate investigation and implementation only after boundaries are explicit.
- **Review-only request:** do not edit. Use ReviewGraph when available and inspect the actual diff/source. Return findings with risk, evidence, and recommendation.
- **Unknown or missing tool:** continue with available repository evidence when possible; disclose the missing capability. Stop only if that tool enforces a required approval or repository gate.
