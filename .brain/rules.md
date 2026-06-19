# Project Rules: a1hub-ui

## Overview

- **Languages:** typescript
- **Framework:** not specified
- **Default branch:** `main`

## Branching

- Task branches: `task/{TASK_ID}-{slug}`
- Epic branches: `epic/{TASK_ID}-{slug}`
- Fix branches: `fix/{TASK_ID}-{slug}`
- Protected branches: `main`, `main`
- Merge strategy for tasks: merge
- Always branch from `main` (or the parent epic branch)

## Commit Convention

Freeform commit messages. Keep them concise and descriptive.
First line: imperative summary (50 chars max)
Body: explain what and why (not how)


## Pull Requests

- All changes to protected branches (`main`, `main`) must go through a PR
- PR title should match the task ID and summary
- Include a description of what changed and why
- Link related issues/tasks

## Testing

- Run tests: `npm test`
- Run lint: `npm run lint`
- All tests must pass before merging
- Add tests for new features and bug fixes

## Code Quality

- Follow existing patterns in the codebase
- No unused imports or dead code
- Keep functions focused and small
- Prefer composition over inheritance

## Working Style

Token-efficient by default — but never at the cost of a correct, complete result.
Brevity serves the work; spend more thinking/words when a hard problem needs them.

- Be concise: lead with the answer or the diff; no preamble, recap, or flattery
- Keep reasoning tight: show the conclusion and the load-bearing why, not the whole search; match effort to difficulty
- Be blunt, not polite: drop hedging and apologies; don't agree just to be agreeable
- Push back when the user is wrong, inconsistent, or asking for a worse design — even if it contradicts the request; correctness outranks deference
- State assumptions and act; ask only when genuinely blocked

## Agent Behavior

- Use `brain_log_insight` for key findings, mistakes, and discoveries
- Use `brain_log_plan` when a plan is approved or completed
- If the task scope diverges from the original plan, reconcile the plan (`brain_log_plan_change`, or a final `brain_log_plan` snapshot) before ending — the ingested plan prose must reflect what actually shipped, not the stale plan
- Do NOT log verbose reasoning or trivial observations
- Only log insights that would be valuable in future sessions
- Track files changed via `brain_session update --add-file`
