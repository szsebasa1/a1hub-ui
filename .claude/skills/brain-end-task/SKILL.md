---
name: brain-end-task
description: End-of-task ritual for the brain memory system. Run when wrapping up
  work in a1hub-ui, when the Stop gate blocks with "[brain]", or before opening a PR.
---

# Brain end-of-task ritual

Run these in order. All steps are idempotent — safe to re-run after a partial pass.

## 1. Reflect and log
- `brain_session(action="update", decision="…")` for each non-obvious decision made
- `brain_log_lesson` (with an `outcome`: worked|failed|partial|flaky|unknown) and
  `brain_log_insight` (always pass `confidence_label`) for reusable findings
- File tracking is automatic (the PostToolUse hook spools every edit); verify with
  `brain_session(action="show")`

## 2. Deep capture (task close only)
If this CLOSES a task (not a pause), run the `task-completion-capture` workflow
(project=a1hub-ui, taskId=<task-id>, persist=true) BEFORE ending the session,
and let its verify-before-close step confirm the logged counts.

## 3. Comprehension gate
- `brain review pending --json` → for each pending review:
  `brain review prompt`, then
  `brain review submit --review-id <id> --verdict CLEAR|REVIEW_REQUIRED|HOLD --content @review.md`
  (or `brain review dismiss --review-id <id>` if the session truly produced no shippable diff)

## 4. Close the session
- Stopping for now: `brain_session(action="pause")` — knowledge stays task-private
- Work complete:   `brain_session(action="end")` — dedups lessons, re-ingests changed
  code, stages a review, flips the task to `done` (its knowledge RELEASES even if the
  branch is still in a PR)
- Read the response: if `comprehension_review_pending` appears, go back to step 3.

## 5. Verify the gate
- `brain session-gate --json` → `should_block` must be `false`
- Commit/PR per the project git workflow; reference the task id (`HUBUI-NNN`) in the commit.
