# brain workflows

Reusable Claude Code multi-agent **workflows** (run via the `Workflow` tool) that
make brain less passive. Tracked in git (the rest of `.claude/` is local). Invoke
by name (`task-completion-capture`) or by `scriptPath`.

---

## `task-completion-capture`

**Problem it fixes.** brain only captures what an agent remembers to push. A real
task (innernow-app **PF-622**) closed having logged just 2 ad-hoc insights — no
lessons, no completed plan, no summary — and the task was even left `status=open`,
so under WIP-isolation that knowledge was invisible. Capture was partial and
unenforced.

**What it does.** At task close, instead of trusting the agent, it runs a harness:

1. **Gather** — reads the `task_sessions` row (goal, scope, decisions, checklist,
   activity, already-logged insights) + the git diff into one context bundle.
   Locates the project repo on disk; degrades gracefully (no diff) if not found.
2. **Extract** (parallel) — insight / lesson / completed-plan+summary extractors,
   each told *not* to duplicate already-logged insights and to prefer specific
   over generic.
3. **Critic** (loop-until-dry, ≤2 rounds) — flags changed files / decisions that
   have no knowledge doc and feeds the gaps back in.
4. **Verify** (adversarial, refute-by-default) — every candidate must be traceable
   to the diff/decisions or it's dropped as filler.
5. **Persist** — builds the exact `brain log-insight/log-lesson/log-plan` commands.
   `persist:false` prints them (dry-run); `persist:true` executes; `closeTask:true`
   runs `brain taskstatus <id> --status merged` **last**, so WIP-isolation flips
   the new knowledge to visible only after it's all logged.

### Args

| arg | default | meaning |
|---|---|---|
| `project` | `my-project` | brain project id |
| `taskId` | — (**required**) | the task to capture, e.g. `PF-622` |
| `repoPath` | auto-discover | project repo on disk (for the git diff) |
| `persist` | `false` | `false` = dry-run (writes nothing); `true` = execute the log commands |
| `closeTask` | `false` | after logging, close the task so its knowledge becomes visible |
| `mode` | `auto` | verify rigor: `auto` (decide by complexity) \| `full` (per-candidate skeptics) \| `lite` (one batched verifier). `lite:true` is honored as an alias. |
| `envFile` | dev-brain `.env` | `BRAIN_ENV_FILE` passed to every brain/python call |

### Usage

Dry-run first (recommended — inspect before writing):

```
Workflow({ name: "task-completion-capture",
           args: { project: "innernow-app", taskId: "PF-622", persist: false } })
```

Then commit for real (logs knowledge, then closes the task):

```
Workflow({ name: "task-completion-capture",
           args: { project: "innernow-app", taskId: "PF-622",
                   persist: true, closeTask: true } })
```

Iterating cheaply: a dry-run leaves a `runId`. Re-invoke with
`resumeFromRunId: "<runId>"` and `persist:true` — gather/extract/critic/verify
return from cache, only the persist agent runs live.

### Cost

A full run is ~14 agents / ~400k output tokens / ~3 min — the per-candidate
adversarial verify (one agent per insight/lesson) dominates. **`mode:auto`**
(default) avoids paying that on simple tasks: the Gather agent rates the task
`low|medium|high` complexity (free — it's already reading the diff), and the
harness uses the cheap batched verifier when the task is `low` complexity **and**
has ≤4 candidates, else the per-candidate skeptics. Force either with
`mode:'full'` / `mode:'lite'`.

> **Known brain bug (found dogfooding this):** `log-insight` writes
> `section_path = insights/<task>/<type>` and upserts on it, so multiple
> same-type insights for one task overwrite each other. The harness works around
> it by grouping same-type insights into a single numbered `log-insight` call.
> The proper fix (unique section paths) is tracked separately.

### Wiring it into task completion

brain stays tool-agnostic, so the trigger lives in the agent layer, not the engine.
When you finish a task in a dogfood project, run this workflow before/at close
instead of hand-logging. A project `CLAUDE.md` can make this a standing instruction
(e.g. "when finishing a brain task, run the `task-completion-capture` workflow with
`persist:true, closeTask:true`").

---

## Gotchas when authoring workflow scripts here

- **No mid-script top-level `return`** — the parser only allows a single trailing
  `return`. Use `throw` for guard clauses.
- **`args` may arrive as a JSON string** — parse defensively:
  `let A = args || {}; if (typeof A === 'string') A = JSON.parse(A)`.
- **No `Date.now()` / `Math.random()`** in scripts (breaks resume). Pass timestamps
  via `args`; the brain CLI stamps its own dates.
- Validate a script before running:
  `{ echo 'async function _(args,log,phase,agent,parallel,pipeline,budget,workflow){'; sed 's/^export const meta/const meta/' FILE; echo '}'; } | node --check -`
