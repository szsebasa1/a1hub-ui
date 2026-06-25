---
name: contrarian-review
description: Adversarial "assumption checker" pass over a load-bearing diff before it
  merges — a separate skeptic that reads the implementation (not the tests) and tries
  to refute that it's correct. Run before merging non-trivial code, when stress-testing
  an implementation, or on code you think is already done.
---

# Contrarian review — an Open Skill (the assumption checker)

> **Why a separate skill, not just "re-read it":** the value is the *posture*. As Nate
> B Jones puts it, the check has to be **a separate skeptic, not the same conversation
> grading its own homework.** The author's context is exactly the blind spot — the
> reviewer must approach the diff cold and try to make it fail.
>
> **One-question test:** moved to a tool with no brain, what breaks? Only the kit
> prompt fetch and the cost bracket (both fail-soft). The *procedure* — fresh-eyes
> refutation of the implementation — travels anywhere.

## Define the work
- **Owns:** a pre-merge adversarial pass that hunts load-bearing defects in code the
  author believes is correct — the bugs that survive normal review because everyone
  shares the author's assumptions.
- **Trigger:** before merging a non-trivial / load-bearing diff; when asked to
  stress-test or "red-team" an implementation; **especially on code you already
  "verified"** — a contrarian pass on done-looking code routinely finds real bugs that
  the author's own tests miss (they encode the same assumptions).
- **Boundary — do NOT run for:** trivial/mechanical diffs (renames, docs, formatting),
  or as a substitute for the comprehension gate (the gate is comprehension coverage;
  this is adversarial correctness). Skip when the diff is too small to hide a bug.
- **Scope:** project-local; the procedure is portable to any project.
- **Source of truth:** the **implementation diff itself** — read the code, not the
  tests. Tests encode the same assumptions the author made, so a green suite is *not*
  evidence of correctness here.
- **Inputs:** the diff/files under review; what the code is *supposed* to guarantee.

## Expose the harness
- **Tools:** `brain kit-prompt contrarian_review` (the review prompt + version_tag);
  a subagent/fresh session for the skeptic pass (Claude Code `Task`/`Agent`); `git diff`.
- **Permissions:** read-only review. It **emits findings**, it does not edit or merge.
- **Secrets:** none.
- **Memory:** reads the diff; confirmed findings should be logged as lessons
  (`brain_log_lesson`, outcome=`failed`/`partial`) so the trap doesn't recur.
- **Compatibility:** Claude Code (subagent dispatch + MCP/CLI). `brain stage` and
  `brain kit-prompt` are fail-soft — if `brain` is absent, run the refutation by hand
  with the posture below.
- **Sync / Owner:** ships in `.claude/brain-skills.zip`; owner is brain.

## Work steps  *(bracketed for cost attribution)*
1. **Mark the stage first** (before the heavy reasoning): `brain stage contrarian_review`
2. **Fetch the posture:** `brain kit-prompt contrarian_review` (reuse its `version_tag`
   for prompt-cache stability).
3. **Dispatch a separate skeptic.** Run the review in a **fresh context** — a subagent
   or a new session — so it does not inherit the author's rationalizations. Give it the
   diff and this instruction: *"Default to 'this is wrong.' For each behavior, construct
   the input that breaks it. Read the implementation; ignore the tests."*
4. **Read the implementation, not the tests.** Walk the actual code paths: edge cases,
   concurrency/dedup, off-by-one, silent fail-soft that hides errors, assumptions about
   data shape/ordering, "we already log X" claims (count the rows).
5. **Classify findings** BLOCKER / SHOULD-FIX / NIT, each with the concrete failing
   input or scenario — no vibes.
6. **Close the stage:** `brain stage -`

## Output
A findings list (BLOCKER / SHOULD-FIX / NIT) with, for each, the exact input or
scenario that triggers it and the fix direction. "Found nothing" is a valid **and
explicit** conclusion — never a silent default.

## Proof
- Every BLOCKER/SHOULD-FIX names a concrete failing input or scenario (reproducible).
- The pass ran in a context separate from the author's, against the implementation.
- `brain turn-cost --window 1 --json` shows a `contrarian_review` stage (bracket fired).

## Stop conditions
- A confirmed BLOCKER halts the merge — fix or explicitly accept-with-reason; do not
  merge past it. A missed defect outweighs the friction of one more pass.

## Runbook role
Runs between work and `brain-end-task` for load-bearing diffs — brain's analogue of
Nate's "Assumption Checker" in the Research Engine runbook.
