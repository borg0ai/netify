---
name: netify-worktree-pr
description: Run a task in an isolated Git worktree with ask-first approval, then finish with a pushed pull request and a removed worktree. Use when work is risky, parallel, or must not disturb the current checkout, or when the user asks for a worktree.
license: MIT
metadata:
  version: "0.3.2"
---

# Netify Worktree PR

Isolate one task in a Git worktree. The task ends only when the work is pushed, a PR is open, and the worktree is gone. Never leave a worktree behind.

## When to use

Run the ask-first gate on every task. Size is never a reason to skip it: the agent does not judge a task small. Ask whether a worktree or branch is wanted; without approval, work in the current checkout.

## Rules

1. **Ask first.** Never create a worktree or branch without explicit approval. Send one question stating: branch name, base branch, worktree path, and that approval covers commit, push, opening a PR, and removing the worktree afterward. Without approval, work in the current checkout.
2. **Do exactly what was approved.** Use the approved branch, base, and path. Do not rename, rebase onto another base, or widen scope. Ask again before changing the plan.
3. **Fixed sequence: use, finish, PR, remove.** Work in the worktree, finish, commit, push, open the PR, then remove the worktree immediately. Do not keep it for review or merge.
4. **No leftovers.** End by running `git worktree list` and reporting it. Any worktree this task created is gone, or listed with the reason it remains.
5. **Destructive actions need their own approval.** `git reset --hard`, `git clean`, force-push, force-removing a dirty worktree, and deleting an unmerged branch each require explicit confirmation for that exact command.

## Workflow

1. **Preflight.** Confirm a Git repository. Record the current branch and `git status --short`. Run `git worktree list`. Confirm the branch name is unused locally and on the remote (`git branch --list <name>`, `git ls-remote --heads origin <name>`) and the path does not exist. Uncommitted changes in the current checkout stay there; a worktree branches from a commit, not from them. Say so if the task depends on them.
2. **Ask.** Send the single approval question from rule 1. Stop until answered.
3. **Create.** Default path is a sibling of the repo, `../<repo>.worktrees/<slug>`, so no `.gitignore` edit is needed. Default branch is `wt/<slug>` unless the repository has a convention or the user chose a name.
   ```bash
   git worktree add -b <branch> <path> <base>
   ```
4. **Work.** Run every edit, build, and test with the worktree as the working directory. Do not touch the main checkout. Delegated workers get the worktree path and exact file ownership; the lead owns integration. Workers must not create worktrees or branches.
5. **Verify.** Run the project's relevant checks inside the worktree. Inspect the full diff against the base. Report exact failures; do not open a PR over a failing required check without saying so.
6. **Commit, push, PR.** Use the repository's commit convention. Stage task paths only.
   ```bash
   git -C <path> add <task paths> && git -C <path> commit -m "<message>"
   git -C <path> push -u origin <branch>
   gh pr create --base <base> --head <branch> --title "<title>" --body "<body>"
   ```
   Report the PR URL. If `gh` is missing, no `origin` remote exists, or the push or PR fails, stop, report the blocker and the worktree path, and do not remove the worktree.
7. **Remove.** Confirm `git -C <path> status --short` is empty and the branch is pushed, then:
   ```bash
   git worktree remove <path>
   ```
   If the worktree is dirty or the push failed, stop, report the path and the blocker, and do not force. Delete the local branch only after the PR merges.
8. **Report.** Show `git worktree list`, the PR URL, the checks run, and anything not verified.

## Done criteria

Done means each of these is shown with command output: changes committed, branch pushed, PR URL reported, worktree removed, `git worktree list` clean of this task's worktree. Missing any one is not done.

## After merge

When the PR merges, delete the local branch (`git branch -d <branch>`) and prune stale refs (`git fetch --prune`). The `post-pr` skill does this when installed.
