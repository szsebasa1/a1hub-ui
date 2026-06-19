# A1hub Ui — Claude Code Guide

## How to Work With Me

Be token-efficient by default — but never at the cost of a correct, complete result. Brevity serves the work; when a hard problem needs more thinking or more words, spend them. The goal is the best possible code, not a short chat.

- **Be concise.** Lead with the answer or the diff. No preamble, no recap of the request, no "Great question." Don't summarize what you did unless asked.
- **Keep reasoning tight.** Show the conclusion and the load-bearing *why* — not the whole search. Match effort to the problem: spend the tokens a hard problem needs, none on an easy one.
- **Be blunt, not polite.** Drop flattery, hedging, and apologies. Don't agree just to be agreeable.
- **Push back.** If I'm wrong, inconsistent, or asking for a worse design, say so and give the better path — even when it contradicts what I asked for. Correctness and code quality outrank deference.
- **State assumptions, then act.** Surface the trade-off and your recommendation directly; don't enumerate every option. Ask only when genuinely blocked.

## Brain Memory System (MANDATORY)

This project uses the **brain MCP server** for semantic memory.

### Context Retrieval Rule (CRITICAL)

**Always use `brain_retrieve` FIRST** for any context, architecture, or code understanding. Only fall back to grep, file reading, or other search tools if brain returns zero relevant results. Brain has pre-indexed semantic context, code chunks with AST metadata, decisions from past tasks, and architectural docs — it is faster and more accurate than raw file search for understanding intent and patterns.

```
1. brain_retrieve(query="...", doc_types="code")     <- ALWAYS try first
2. brain_retrieve(query="...", project_id="all")     <- broaden if needed
3. grep / file read                                  <- ONLY if brain returns nothing
```

**Never** read files from a `/memory/` folder.

### Before Starting Any Task

Call the `brain_new_task` MCP tool:

```
brain_new_task(goal="<short goal>", query="<seed retrieval query>")
```

**Read the response carefully:**
- `task_id` — your task ID for the entire session (e.g. HUBUI-127)
- `git_workflow` — branch name, base branch, merge strategy (**follow these**)
- `critical_rules_preamble` — read FIRST: non-negotiable rules
- `permanent_preferences` — coding style, architectural constraints
- `context` — relevant project docs and walkthroughs
- `code_context` — relevant code chunks with AST metadata
- `preamble` — cache-stable session preamble (markdown + version_tag + stable_until). **Place `preamble.markdown` at the top of your working context** and treat it as stable for the duration of the task. The dynamic state (current task, sibling activity, pending_backfills) flows after.
- `retrieval_contract_gap` (new) — if present, the rooms you are touching have no recent architectural reasoning contract. **Follow the embedded instructions** immediately: run `brain_contract_define`, produce the 7-dimension spec, then `brain_contract_submit` with `--confidence user-confirmed`. This is now mandatory before major work in that scope.

### Resuming After a Break

```
brain_resume()
```

There is no "pause" command. Sessions stay active until ended. Idle gaps >30 min are auto-excluded from time tracking. Just call `brain_resume` when you come back.

### During Work

**Retrieve context** (never read memory files directly):
```
brain_retrieve(query="<topic>", doc_types="code")
brain_retrieve(query="<topic>", doc_types="architecture")
brain_retrieve(query="<topic>", project_id="all")  # cross-repo search
```

**Understand architectural reasoning and provenance (strongly recommended):**
```
brain_architecture(room="<room>")          # big-picture view for a module
brain_why("<symbol or decision>")          # git history + linked insights/contracts
brain_contract_define                      # when you see a gap or need to capture reasoning
```
Always pass `--confidence` when logging insights or lessons:
`brain_log_insight --type decision ... --confidence user-confirmed`

**Track progress:**
```
brain_session(action="update", decision="<concise decision>")
brain_session(action="update", check="<checklist item>")
brain_session(action="update", add_file="<path>")
```

**When scope drifts, revise the plan as it happens.** The moment the implementation diverges from the approved plan — work added, dropped, or done a different way — call `brain_log_plan_change` (version + one-line delta + new body) so the plan never falls out of sync with what you're actually building.

### Harness Hooks (automatic)

This project has the brain harness hooks installed (`.claude/settings.json`):

- **File tracking is automatic** — every Edit/Write is spooled into the active brain session by a PostToolUse hook; you do not need `add_file` for files you edited through tools.
- **The Stop gate enforces the end-of-task ritual** — wrapping up with an active session and untracked work blocks once, pointing at the `/brain-end-task` skill. Run the skill rather than fighting the gate. Escape hatch (rare, human-approved): `BRAIN_HOOK_BYPASS=1`.
- **SessionStart injects brain state** — whether to call `brain_resume` vs `brain_new_task`, and any pending comprehension reviews.
- **Code-health nudge** — the PostToolUse hook warns when you edit a file past `[code_health] max_file_lines`. Small, focused modules classify into ONE behavioral room and retrieve precisely — better for the deliverable AND for brain. When you see the nudge, split the file (extract by responsibility/room) rather than growing it.

### Code Health (code-splitting)

Run `brain_code_health` (or `brain code-health --json`) before finishing a task — ideally scoped to the files you touched (`paths=[...]`). It flags files that are too long, have an oversized function, span too many behavioral rooms, or sit misplaced in a furniture folder. Aggressiveness is controlled by `[code_health] level` in `.brainconfig` (off | warn | strict); at `strict` the command exits non-zero so CI / the end-of-task gate can block. Prefer splitting a growing module over letting it become a monolith — it directly improves brain's room classification, retrieval precision, and comprehension tracking.

### Ending a Task

**MANDATORY — follow all steps in order** (or simply invoke the `brain-end-task` skill, which walks them):

**Keep the plan in sync with reality.** If the task's scope evolved from its original plan — work added, dropped, or done a different way — reconcile the plan to match what actually shipped (`brain_log_plan_change` for a revision, or a final `brain_log_plan` snapshot) **before** the ingest step below. The plan prose is ingested as the durable record; a stale plan makes brain describe work that never happened.

1. **Reflect** — before calling `brain_session(action="end")`, write a short reflection: what changed, key decisions, surprises, and any patterns worth remembering across future tasks.
2. **Save insights to brain** — call `brain_session(action="update", decision="...")` for each non-obvious decision or lesson learned during the task.
3. **Run the comprehension gate on the diff** (see *Comprehension Layer* below). Pass `touched_paths` so verdict ceiling enforcement works.
4. **Ingest code** — call `brain_session(action="end", ingest_code_path=".")` to index all changed files.
5. **Open a PR** to `main` (or the base branch from `git_workflow`).
6. **Commit** using the task ID: `git commit -m "HUBUI-127: <description>"`
7. **Reinforce useful retrievals** — call `brain_mark_useful(doc_id=...)` for the one or two `brain_retrieve` hits that actually unblocked you (pass each hit's `id`). Closes brain's self-learning loop; your comprehension verdict already credits exposure automatically.

### Comprehension Layer (MANDATORY)

Brain tracks **dark code** — code nobody understood when it shipped — through three artifacts per module (manifest, contracts, decisions), plus dark-code audits, comprehension-gate reviews, and **retrieval contracts** (the 7-dimension architectural reasoning spec from the New RAG War framework). Follow these rules to keep coverage rising:

**1. First time touching a module — capture context layers:**
```
brain_kit_prompt(name="context_layers")  # fetch the interview prompt
# Run the interview against the module, then store each layer:
brain_context_layer(module="my-module", layer="manifest",  content="...")
brain_context_layer(module="my-module", layer="contracts", content="...")
brain_context_layer(module="my-module", layer="decisions", content="...")
```
The kit prompt has a stable `version_tag` — paste the body into the LLM with caching.

**2. Before opening a PR — run the comprehension gate:**
```
brain_kit_prompt(name="comprehension_gate")  # fetch prompt
# Run prompt against the diff, then store the verdict with touched paths:
brain_comprehension_gate(
    change_ref="PR-127",
    verdict="CLEAR",                          # CLEAR | REVIEW | HOLD
    review_markdown="...",
    findings_json="[...]",
    touched_paths=["src/foo.ts", "src/bar.ts"],
)
```
**`touched_paths` is required** for ceiling enforcement. The gate caps `CLEAR -> REVIEW` if any touched module is missing layers, and `REVIEW -> HOLD` if any open critical hotspot lives in scope. The original verdict is preserved as `metadata.verdict_requested`.

**3. Periodic visibility:**
```
brain_comprehension_status(project_id="a1hub-ui")   # per-module score + project rollup
brain_comprehension_tree(project_id="a1hub-ui")     # hierarchical map (cached)
brain_hotspot_list(project_id="a1hub-ui")           # open critical+high hotspots
brain_architecture()                               # human-readable reasoning map (includes contracts)
```

**4. Architectural reasoning contracts (new primary mechanism):**
When `newtask` surfaces a `retrieval_contract_gap`, or when you are about to make
significant changes to a module, capture the full contract:
```
brain_contract_define
# ... think through the 7 dimensions ...
brain_contract_submit --kind define --content @contract.md --scope <room> --confidence user-confirmed
```
These contracts appear in `brain_architecture`, `brain_why`, and future rebuilds.

**4. Capturing a dark-code audit when investigating risk:**
```
brain_kit_prompt(name="dark_code_audit")
# Run interview, then:
brain_dark_code_audit(
    scope="my-module",
    risk_level="High",
    audit_markdown="...",
    hotspots_json="[{component: ..., severity: ..., ...}]",
)
```
Each hotspot is auto-linked to its module via `linked_modules` so the dashboard rolls up correctly.

### Multi-Agent Crew (Complex Tasks)

```
brain_crew(task_description="<refactor description>", epic=true)
```

### Cache-Stable Outputs

Brain shapes its outputs so the agent harness's prompt cache spans large stable prefixes. You don't need to do anything for this to work, but knowing the contract helps:

- **`brain_new_task` and `brain_resume`** return a top-level `preamble` field with `markdown` + `version_tag` + `stable_until: "session_end"`. Render `markdown` at the top of your context as the cache anchor.
- **`brain_comprehension_tree` and `brain_comprehension_status`** include a `cache_hint` block with `version_tag` and `stable_until`. Treat the response body as cacheable until `version_tag` changes.
- **`brain_kit_prompt`** returns prompt body + `version_tag` (sha256 of file). Reuse the same `version_tag` across sessions to hit the LLM provider's prompt cache.
- **Stored artifacts** (manifests, contracts, decisions, audits, gate reviews, lessons, plans) are written without timestamps in their bodies — timestamps live in metadata. This means re-injecting an artifact across multiple LLM calls in a session is byte-stable.
- **`brain_retrieve`** returns deterministically ordered chunks: `(score desc, id asc)`. Two identical queries hit the same cache prefix.

### MCP Fallback

If MCP connection fails, use CLI: `brain newtask "goal" --json`, `brain retrieve "query" --json`, etc. The CLI is a first-class agent surface: `--json` prints exactly one machine-readable JSON object on stdout, exit code mirrors `payload.ok`, and telemetry/progress noise stays off piped stderr — capturing `2>&1` is safe. Retrieve hits carry a `read` block ({file_path, offset, limit}) you can feed straight into a file-read tool.

---

## Project IDs

| Repo | project_id | prefix | default_branch |
|---|---|---|---|
| a1hub-ui | `a1hub-ui` | `HUBUI` | `main` |
| a1hub-front | `a1hub-front` | `?` | *see that repo's .brainconfig* |

Cross-project context is automatic — `.brainconfig` has `related_projects`.

---

## Git Workflow

Follow `git_workflow` from `brain_new_task` response:
- **All new tasks branch from `main`** unless explicitly told otherwise or the task belongs to an epic (epic subtasks branch from the epic branch)
- Branch naming: `task/{TASK-ID}-{slug}` or `epic/{TASK-ID}-{slug}`
- **Commit often** to the task branch
- **NEVER push or merge directly into `main`** — only pull requests are authorized to land on a protected branch
- **Merge-merge** into the base branch via PR when done
- Epic tasks: `brain_new_task(goal="...", epic=true)` -> subtasks: `brain_new_task(goal="...", parent_epic="HUBUI-130")`

### Pull Request Requirements

Every PR into a protected branch **must** include all sections below in the description. Customize per project as needed.

```
## What changed
<concise description of the change>

## Why
<motivation and context>

## Risk level
<Low / Medium / High — and a one-line justification>

## How tested
<test steps and evidence — unit tests, manual steps, screenshots, logs>

## Rollback notes
<how to revert if this goes wrong — feature flag, commit, migration>
```

---

## Error Fallbacks

| Scenario | Action |
|----------|--------|
| MCP down | Fall back to CLI: `brain newtask "goal" --json` |
| Zero results | Broaden: remove doc_types -> remove task_id -> simplify query |
| Session conflict | `brain_session(action="show")`, if stale `brain_session(action="end")`, then `brain_new_task` |

---

**IMPORTANT:** Always call `brain_new_task` or `brain_resume` at the start of every session.

*Generated by `brain claude-rules`. Re-run after `.brainconfig` changes or when new brain features land. Project-specific additions (tech stack, specialized agents, custom rules) go below the marker line and are preserved across regenerations when you re-run with `--merge`.*

<!-- brain:claude-rules:end-managed-content -->
