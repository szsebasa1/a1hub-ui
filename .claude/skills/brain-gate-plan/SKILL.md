---
name: brain-gate-plan
description: Right after brain_new_task/brain_resume, recommend WHICH harness gates are
  worth running for THIS task's risk and size — by reading brain workflow-health and the
  new_task risk signals. A non-binary, human-surfaced note, never an auto-skip.
---

# Brain gate plan — an Open Skill (adaptive harness, the cheap start)

> This is the first, deliberately-minimal step of the adaptive layer: match the
> *harness* to the *task* the way Nate B Jones's "Agentic Harness Designer" matches a
> system to its problem. It **reads** the effort/reward instruments and **surfaces a
> recommendation** — it does not decide. The human (or, later, the calibration loop)
> decides.

> **Load-bearing rule (the asymmetry):** a **missed defect outweighs any friction.**
> The default is **run every gate.** A step may only be recommended *down* when its
> historical catch-rate is low **and** this task is genuinely low-risk **and** that is
> corroborated by zero downstream failures. When unsure, recommend running it.

## Define the work
- **Owns:** a task-start recommendation of which gates (comprehension gate, contrarian
  review, dark-code audit, the new_task advisory gaps) are worth the cost **for this
  task**, given its risk/size and each gate's measured help-vs-hinder.
- **Trigger:** immediately after `brain_new_task` (or `brain_resume`), before doing the
  work — while the new_task risk signals are in hand.
- **Boundary — do NOT use it to:** auto-skip a gate, suppress a gate silently, or
  override a HOLD/REVIEW verdict. It informs the *plan*; it never replaces a gate's
  own judgment at close time.
- **Scope:** project-local; the recommendation is advisory and per-task.
- **Source of truth:** `brain workflow-health --json` (measured per-step
  runs/caught/cost) + the `brain_new_task` response's risk signals — not intuition.
- **Inputs:** the `brain_new_task` response (`scope_paths`, `dark_code_signals`,
  `related_tasks`, `parent_epic`); optionally `brain friction --json` and
  `brain turn-cost --json`.

## Expose the harness
- **Tools:** `brain workflow-health --json`, `brain friction --json`,
  `brain turn-cost --json` (all read-only); the `brain_new_task` response already in
  context.
- **Permissions:** **read-only.** Emits a note. Changes nothing.
- **Secrets:** none.
- **Memory:** reads instruments + the task signals; writes nothing durable (the
  recommendation is a turn-local note). If a recommendation proves right/wrong later,
  capture that as a lesson at end-task.
- **Compatibility:** Claude Code (MCP/CLI). All reads are fail-soft — no data yet ⇒
  recommend the full gate set and say so. Untested without brain.
- **Sync / Owner:** ships in `.claude/brain-skills.zip`; owner is brain.

## Work steps
1. **Profile this task's risk/size** from the `brain_new_task` response:
   - *Higher risk* → any of: `dark_code_signals.trigger_*` true,
     `hotspot_rooms_in_context` non-empty, `recommend_apply_full` true,
     `churn_hotspot_files` / `single_owner_files` / `cold_code_files` present, broad
     `scope_paths`, `parent_epic` set.
   - *Lower risk* → none of the above; narrow scope; docs/test-only/mechanical diff.
2. **Read the scoreboard:** `brain workflow-health --json`. For each step note its
   `kind`, `caught_rate`, `cost_per_run`, `runs`, and `note`. Vocabulary already in the
   data: *"earning its place"* (rate high), *"mixed — explore by task class"*,
   *"rarely catches — candidate to gate behind risk"* (rate low over enough runs),
   *"fires but never acted on"* (advisory_gap, caught=0), *"insufficient data"* (low n).
3. **Compose a per-gate recommendation** (NON-BINARY):
   - **Run** — default; always run for higher-risk tasks regardless of catch-rate.
   - **Run (lighter touch)** — gate is "mixed" and this task is low-risk: run it but
     timebox / scope to touched files.
   - **Consider deferring — your call** — ONLY when catch-rate is low over sufficient
     `runs` **and** this task is low-risk **and** no corroborating downstream failures.
     Present it as a question to the human, with the evidence, never as a decision.
4. **Surface the note to the user** and proceed. The recommendation is the output;
   the human chooses what to actually run.

## Output
A short, per-gate note: `gate — recommendation — one-line evidence (caught_rate over N
runs, cost/run) — this-task risk factor`. Plus an explicit headline: the default is to
run everything; here is only where the data suggests a lighter touch.

## Proof
- Each recommendation cites a real `workflow-health` figure (caught_rate, runs, cost)
  and a concrete risk signal from the new_task response — no unevidenced advice.
- No gate is ever marked "skip"; the strongest output is "consider deferring — your call."

## Stop conditions
- `workflow-health` returns insufficient data (low `runs`) → recommend the **full**
  gate set and say the data isn't there yet. Never down-recommend on thin evidence.

## Runbook role
The opening step of brain's task lifecycle runbook: **`brain_new_task` →
`brain-gate-plan` → work → `contrarian-review` → `brain-end-task`.**

## Graduation path (honest scope note)
This is intentionally a **prompt that reads existing instruments** — the cheap first
step. If the recommendation proves useful, the risk→gate logic should graduate into a
`brain gate-plan` CLI command (real logic in a command, the skill subprocesses it) so
it is computed once and consistently, not re-derived each task.
Until then, this skill is the surface; `workflow-health` is the substrate.
