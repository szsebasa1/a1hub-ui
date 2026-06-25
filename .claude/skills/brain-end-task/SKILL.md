---
name: brain-end-task
description: End-of-task ritual for the brain memory system. Run when wrapping up
  work in a brain-tracked project, when the Stop gate blocks with "[brain]", or before opening a PR.
---

# Brain end-of-task ritual — an Open Skill

> **One-question test (Nate B Jones, Open Skills):** *if you moved this skill to a
> tool with no brain, what would break?* Everything under **Expose the harness**.
> That section is written down precisely so the skill can be inspected, moved, and
> trusted — not just run because this one machine happens to be set up for it.

The hot path is **Work steps**. The rest is the contract that makes it portable.

---

## Define the work
- **Owns:** the close-out of a brain task — turning a finished diff into durable,
  visible knowledge (insights, lessons, completed plan, comprehension verdict) and a
  clean gate, so the next task inherits what this one learned.
- **Trigger:** wrapping up work in a brain-tracked project; the Stop gate blocks with
  `[brain]`; or before opening a PR.
- **Boundary — do NOT run when:** you are *pausing* not finishing (use
  `brain_session(action="pause")`, knowledge stays task-private); the session produced
  no shippable diff (dismiss the review instead). This is task close-out only — not a
  mid-task checkpoint.
- **Scope:** project-local (see `CLAUDE.md` for this project's id + task prefix). The
  **procedure** is portable; the brain install is the harness it needs.
- **Source of truth:** the brain `task_sessions` row + the **git diff** + the kit
  prompts — never your memory of what the task did. If the plan drifted from what
  shipped, reconcile the plan (`brain_log_plan_change`) **before** capture.
- **Inputs:** an active brain session + its `task_id`; the set of touched paths
  (`touched_paths`, required by the comprehension gate for ceiling enforcement).

## Expose the harness  (what must exist for this to run)
- **Tools:** brain MCP tools (`brain_session`, `brain_review_*`, `brain_log_*`) **or**
  the `brain` CLI fallback (`brain <cmd> --json`, machine JSON on stdout); `git`/`gh`;
  the `task-completion-capture` Workflow.
- **Permissions:** writes the brain DB (insights / lessons / plan / verdict),
  re-ingests changed code, flips task work-status; commits and opens a PR. **No deletes.**
- **Secrets:** Supabase + Ollama credentials live in `.brainconfig` / env — **never in
  this file.** The skill names the dependency; it does not carry the secret.
- **Memory:** *reads* the task session + prior lessons; *writes back* durable
  insights/lessons/plan + the comprehension verdict; the `brain stage` markers below
  are **run-local** NDJSON (`~/.cache/brain/stage_markers.ndjson`), not durable memory.
- **Compatibility:** needs Claude Code hooks — the **Stop gate** + the **PostToolUse
  edit-spool** (`.claude/settings.json`; spool at `.brain/state/session-files.jsonl`).
  `brain/hooks.py` is **stdlib-only**. `brain stage` is **fail-soft**: if `brain` is
  absent the call is a no-op — it must never block the ritual. Tested in: Claude Code
  (MCP + CLI). Untested elsewhere; in a tool without these hooks, run the steps manually.
- **Sync / Owner:** this skill is **package data** in brain (`brain/assets/skills/`),
  installed into a project's `.claude/skills/` by `brain skills install` and
  drift-checked by `brain skills check` (per-file content hash; local edits protected
  unless `--force`). **Owner:** brain (the harness owner). Don't hand-edit the installed
  copy — edit the canonical asset in `brain/assets` and re-run `brain skills install`.

---

## Work steps  (run in order; every step is idempotent — safe to re-run)

### 1. Reflect and log
- `brain_session(action="update", decision="…")` for each non-obvious decision.
- `brain_log_lesson` (with `outcome`: worked|failed|partial|flaky|unknown) and
  `brain_log_insight` (always pass `confidence_label`) for reusable findings.
- File tracking is automatic (the PostToolUse hook spools every edit); verify with
  `brain_session(action="show")`.

### 2. Deep capture — task close only  *(bracketed for cost attribution)*
If this CLOSES a task (not a pause):
- **Mark the stage first** (before the heavy generation, so `turn-cost` can attribute
  it): `brain stage task_completion_capture`
- Run the `task-completion-capture` workflow (`project=<this project's id from
  CLAUDE.md>`, `taskId=<task-id>`, `persist=true`) and let its verify-before-close step
  confirm the logged counts.
- **Close the stage:** `brain stage -`

### 3. Comprehension gate  *(bracketed for cost attribution)*
The gate's real cost is the **review writing**, which lives in no-tool reasoning turns
*before* the tiny `review submit` call — so it can only be attributed with an explicit
bracket set **before** you start writing:
- **Mark the stage first:** `brain stage comprehension_gate`
- `brain review pending --json` → for each pending review: `brain review prompt`, write
  the review against the **diff** (pass `touched_paths`), then
  `brain review submit --review-id <id> --verdict CLEAR|REVIEW_REQUIRED|HOLD --content @review.md`
  (or `brain review dismiss --review-id <id>` if the session truly produced no
  shippable diff).
- **Close the stage:** `brain stage -`

### 4. Close the session
- Work complete: `brain_session(action="end")` — dedups lessons, re-ingests changed
  code, stages a review, flips the task to `done` (knowledge RELEASES even if the
  branch is still in a PR).
- Stopping for now instead: `brain_session(action="pause")` — knowledge stays private.
- Read the response: if `comprehension_review_pending` appears, go back to step 3.

### 5. Verify the gate, then ship
- `brain session-gate --json` → `should_block` must be `false`.
- Commit / PR per the project git workflow; reference the task id (`<PREFIX>-NNN` —
  the prefix is in `CLAUDE.md`).

---

## Proof  (evidence required before this task is "done" — no unevidenced "done")
- A comprehension verdict is **stored with `touched_paths`** (ceiling enforcement ran).
- `task-completion-capture` reported **verified logged counts** (capture didn't write 0).
- `brain session-gate --json` → `should_block: false`.
- **Cost receipt (optional):** `brain turn-cost --window 1 --json` shows the
  `task_completion_capture` and `comprehension_gate` stages with non-zero generation —
  proof the brackets actually fired.

## Stop conditions  (halt and ask, don't improvise)
- Any failing check or unresolved gate finding → leave the verdict at **HOLD / REVIEW**
  and **do not merge**. A missed defect outweighs the friction of stopping.
- Capture persist dies mid-run (session-limit): log the verified JSON via the `brain`
  CLI, confirm the count, **then** close — never close a task with capture showing 0.
- Escape hatch (rare, human-approved only): `BRAIN_HOOK_BYPASS=1`.

## Runbook role
The closing stage of brain's task lifecycle runbook: **`brain_new_task` →
`brain-gate-plan` → work → `contrarian-review` (for load-bearing diffs) →
`brain-end-task`**. This is brain's "flywheel": no useful discovery dies in chat.
