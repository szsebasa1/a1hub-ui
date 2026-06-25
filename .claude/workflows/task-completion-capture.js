export const meta = {
  name: 'task-completion-capture',
  description: 'When a brain task closes, fan out agents to extract + verify complete knowledge (insights, lessons, completed plan, summary) and persist it via the brain CLI — so a finished task yields durable knowledge instead of a couple of ad-hoc insights.',
  whenToUse: 'Run at task completion (a brain task you are finishing). Fixes the "I finished a task but nothing/little was logged" gap: it reads the session + git diff, extracts knowledge, adversarially verifies it is grounded, and logs it before the task closes (so WIP-isolation flips it to visible). Pass {project, taskId, repoPath, persist, closeTask, envFile} as args.',
  phases: [
    { title: 'Gather',   detail: 'read the task session + git diff into one context bundle' },
    { title: 'Extract',  detail: 'parallel extractors: insights, lessons, completed-plan, summary' },
    { title: 'Critic',   detail: 'completeness critic — what changed but went undocumented (loop-until-dry)' },
    { title: 'Verify',   detail: 'adversarial pass — keep only specific, diff-grounded knowledge' },
    { title: 'Persist',  detail: 'log verified knowledge via brain CLI, then optionally close the task' },
  ],
}

// ---- args + defaults -------------------------------------------------------
// args may arrive as a parsed object or (depending on the caller) a JSON string.
let A = args || {}
if (typeof A === 'string') { try { A = JSON.parse(A) } catch (e) { A = {} } }
const PROJECT  = A.project  || 'my-project'
const TASK_ID  = A.taskId   || null            // required
const REPO     = A.repoPath || null            // project repo on disk (for git diff); optional
const PERSIST  = A.persist === true            // default DRY-RUN: print would-be commands, write nothing
const CLOSE    = A.closeTask === true          // after logging, run `taskstatus --status done` (work complete; `merged` additionally means shipped)
// Verify strategy: 'auto' (decide by task complexity, default) | 'full'
// (per-candidate adversarial skeptics) | 'lite' (one batched verify agent).
// `lite:true` is honored as a back-compat alias for mode:'lite'.
const MODE     = A.mode || (A.lite === true ? 'lite' : 'auto')
const LITE_MAX_CANDIDATES = 4                  // auto: at/under this many candidates, batched verify is enough
const ENV_FILE = A.envFile  || '/Users/rtagliavia/Development/dev-tools/dev-brain/.env'
const BRAIN_REPO = '/Users/rtagliavia/Development/dev-tools/dev-brain-v2'
// env prefix every brain/python call must carry (Supabase creds + telemetry)
const ENVP = `BRAIN_ENV_FILE=${ENV_FILE} BRAIN_TELEMETRY=1`

if (!TASK_ID) throw new Error('task-completion-capture: taskId required — pass args:{project,taskId,...}')
log(`capture for ${PROJECT}/${TASK_ID} · persist=${PERSIST} · closeTask=${CLOSE}`)

// ---- schemas ---------------------------------------------------------------
const GATHER = {
  type: 'object', additionalProperties: false,
  required: ['taskId','goal','scopePaths','changedFiles','decisions','existingInsights','repoFound','complexity','knownRooms'],
  properties: {
    taskId: { type: 'string' },
    goal: { type: 'string' },
    knownRooms: { type: 'array', items: { type: 'string' },
      description: 'the project\'s real code rooms (domain buckets) — the choice set for assigning each insight/lesson a room' },
    complexity: { type: 'string', enum: ['low','medium','high'],
      description: 'task complexity for choosing verify rigor. low = a few files, one concern, low risk. medium = several files or a non-trivial behavior change. high = many files, cross-cutting/concurrency/payments/auth/migration risk, or subtle invariants.' },
    complexityReason: { type: 'string', description: 'one line justifying the complexity rating' },
    status: { type: 'string', description: 'session status (active|ended) + task status if known' },
    scopePaths: { type: 'array', items: { type: 'string' } },
    changedFiles: { type: 'array', items: { type: 'object', additionalProperties: false,
      properties: { path: { type: 'string' }, status: { type: 'string' } }, required: ['path','status'] } },
    diffSummary: { type: 'string', description: 'files/insertions/deletions, or why diff is unavailable' },
    decisions: { type: 'array', items: { type: 'string' } },
    checklist: { type: 'array', items: { type: 'string' } },
    activityHighlights: { type: 'array', items: { type: 'string' } },
    existingInsights: { type: 'array', items: { type: 'string' }, description: 'insight contents already logged for this task (do NOT duplicate these)' },
    repoFound: { type: 'boolean' },
    notes: { type: 'string' },
  },
}
const INSIGHTS = {
  type: 'object', additionalProperties: false, required: ['insights'],
  properties: { insights: { type: 'array', items: { type: 'object', additionalProperties: false,
    required: ['insightType','content','scope'],
    properties: {
      insightType: { type: 'string', enum: ['finding','mistake','discovery','decision','learning'] },
      content: { type: 'string', description: 'one specific, self-contained finding grounded in the diff/decisions' },
      scope: { type: 'array', items: { type: 'string' }, description: 'path prefixes this applies to' },
      room: { type: 'string', description: 'the domain/room this belongs to — pick the best match from knownRooms by the subsystem the finding is about (not the folder path). Use "commons" only if genuinely cross-cutting.' },
      confidence: { type: 'string', enum: ['observed','inferred','user-confirmed'] },
    } } } },
}
const LESSONS = {
  type: 'object', additionalProperties: false, required: ['lessons'],
  properties: { lessons: { type: 'array', items: { type: 'object', additionalProperties: false,
    required: ['outcome','content','scope'],
    properties: {
      outcome: { type: 'string', enum: ['worked','failed','partial','flaky','unknown'] },
      content: { type: 'string', description: 'actionable lesson: what to do / avoid next time in this scope' },
      scope: { type: 'array', items: { type: 'string' } },
      room: { type: 'string', description: 'the domain/room this belongs to — pick the best match from knownRooms by subsystem (not folder). "commons" only if genuinely cross-cutting.' },
    } } } },
}
const PLAN = {
  type: 'object', additionalProperties: false, required: ['title','content','summary'],
  properties: {
    title: { type: 'string' },
    content: { type: 'string', description: 'the completed plan: what was actually built, the approach, key files, follow-ups' },
    summary: { type: 'string', description: '2-4 sentence stakeholder-facing summary of what shipped and why' },
  },
}
const CRITIC = {
  type: 'object', additionalProperties: false, required: ['missing','done'],
  properties: {
    done: { type: 'boolean', description: 'true when nothing material is undocumented' },
    missing: { type: 'array', items: { type: 'object', additionalProperties: false,
      required: ['kind','why','suggestion'],
      properties: {
        kind: { type: 'string', enum: ['insight','lesson'] },
        why: { type: 'string', description: 'what changed/was decided that has no knowledge doc' },
        suggestion: { type: 'string', description: 'the concrete insight/lesson content to add' },
        scope: { type: 'array', items: { type: 'string' } },
      } } },
  },
}
const VERDICT = {
  type: 'object', additionalProperties: false, required: ['grounded','reason'],
  properties: {
    grounded: { type: 'boolean', description: 'true ONLY if specific + traceable to the diff/decisions; false for generic filler' },
    reason: { type: 'string' },
  },
}

// ---- Phase 1: Gather -------------------------------------------------------
phase('Gather')
const gatherPrompt = `You are gathering the full context for brain task ${TASK_ID} (project ${PROJECT}) so its knowledge can be captured at completion.

STEP 1 — read the task session + already-logged insights from the brain DB. Run this exact command and parse its JSON:
\`\`\`
cd ${BRAIN_REPO} && ${ENVP} .venv/bin/python -c "
import json
from brain.cli import _get_client
from brain.supabase_client import get_session
c=_get_client()
s=get_session(c, '${PROJECT}', task_id='${TASK_ID}') or {}
ins=c.table('project_documents').select('content,doc_type,metadata').eq('project_id','${PROJECT}').execute().data or []
mine=[x['content'] for x in ins if (x.get('metadata') or {}).get('task_id')=='${TASK_ID}' and x.get('doc_type')=='agent_insight']
from brain import room_taxonomy as _rt
_rr='${REPO}'
_rr=_rr if _rr and _rr not in ('null','undefined','None') else None
_tax=_rt.load('${PROJECT}', repo_root=_rr)
known_rooms=[r for r in _tax.rooms.keys() if r != 'other']
print(json.dumps({
  'goal': s.get('primary_goal'),
  'status': s.get('status'),
  'scope_paths': s.get('scope_paths') or [],
  'decisions': s.get('decisions') or [],
  'checklist': s.get('checklist') or [],
  'activity_log': (s.get('activity_log') or [])[-25:],
  'parent_epic': s.get('parent_epic'),
  'existing_insights': mine,
  'known_rooms': known_rooms,
}, default=str))
"
\`\`\`

STEP 2 — try to get the git diff of the work. The project repo${REPO ? ` is at: ${REPO}` : ' path was NOT provided'}.
${REPO ? `cd "${REPO}" and find the task's base: try \`git log --oneline -20\`, then \`git diff --stat\` and \`git diff --name-status\` against the likely base (main/develop or the branch point). If you can identify a branch for ${TASK_ID}, diff against its merge-base with the default branch.` : `Search likely locations for the repo (e.g. ~/Development, ~/dev, ~/code, ~/Projects) for a directory matching "${PROJECT}". If found, get \`git diff --name-status\` + \`git diff --stat\` for recent work. If not found, set repoFound=false and proceed WITHOUT a diff — rely on the session decisions/activity/scope.`}

Return the GATHER object. Put the goal, scopePaths, changedFiles (path+status), a diffSummary string, decisions (as strings), checklist (as strings), activityHighlights (notable activity_log entries), existingInsights (verbatim contents already logged — these must NOT be re-logged), and knownRooms (the \`known_rooms\` list verbatim from STEP 1's JSON — the project's real code-domain buckets). Set repoFound accordingly. Be faithful; do not invent files or decisions.

Also rate the task's \`complexity\` (low|medium|high) with a one-line \`complexityReason\`. Base it on blast radius and risk: low = a few files / single concern / low risk; medium = several files or a non-trivial behavior change; high = many files, OR cross-cutting concerns, concurrency/async ordering, payments/billing, auth, data migrations, or subtle invariants that are easy to get wrong. When in doubt, rate higher.`
const ctx = await agent(gatherPrompt, { label: `gather:${TASK_ID}`, phase: 'Gather', schema: GATHER })
if (!ctx) throw new Error('task-completion-capture: gather stage returned nothing')
log(`gathered: ${ctx.changedFiles.length} changed files, ${ctx.decisions.length} decisions, ${ctx.existingInsights.length} existing insights, complexity=${ctx.complexity}, repoFound=${ctx.repoFound}`)

const CTXJSON = JSON.stringify(ctx)

// ---- Phase 2: Extract (parallel fan-out) -----------------------------------
phase('Extract')
const base = `Task ${TASK_ID} (project ${PROJECT}). Goal: ${ctx.goal}\nHere is the full task context as JSON (changed files, decisions, checklist, activity, insights ALREADY logged, and knownRooms — the project's real code-domain buckets):\n${CTXJSON}\n\nGround everything in this context. Do NOT restate anything already in existingInsights. Prefer fewer, specific, high-signal items over many generic ones. If the context is too thin to support an item, return an empty list rather than inventing.\n\nFor EACH item, set \`room\` to the best match from knownRooms based on the SUBSYSTEM the knowledge concerns (e.g. a paywall/RevenueCat finding → "superwall", a notification finding → "one-signal") — judge by meaning, not by which folder a file sits in. Use "commons" only when the knowledge is genuinely cross-cutting and fits no single room.`
const [insRes, lesRes, planRes] = await parallel([
  () => agent(`${base}\n\nExtract durable INSIGHTS (findings/mistakes/discoveries/decisions/learnings) a future engineer would want when touching this area. Each must be self-contained and traceable to a changed file or a decision.`,
    { label: 'extract:insights', phase: 'Extract', schema: INSIGHTS }),
  () => agent(`${base}\n\nExtract LESSONS — outcome-tagged, actionable guidance scoped to path prefixes (what worked / failed / was flaky and what to do next time). Only lessons that would change future behavior; skip platitudes.`,
    { label: 'extract:lessons', phase: 'Extract', schema: LESSONS }),
  () => agent(`${base}\n\nWrite the COMPLETED PLAN for this task: what was actually built, the approach taken, the key files/areas, and any follow-ups left open. Also write a 2-4 sentence stakeholder SUMMARY of what shipped and why it matters. Base it strictly on the context.`,
    { label: 'extract:plan', phase: 'Extract', schema: PLAN }),
])
let insights = (insRes && insRes.insights) || []
let lessons  = (lesRes && lesRes.lessons) || []
const plan   = planRes || null
log(`extracted: ${insights.length} insights, ${lessons.length} lessons, plan=${plan ? 'yes' : 'no'}`)

// ---- Phase 3: Completeness critic (loop-until-dry, max 2 rounds) -----------
phase('Critic')
let dry = 0
for (let round = 0; round < 2 && dry < 1; round++) {
  const have = JSON.stringify({ insights: insights.map(i => i.content), lessons: lessons.map(l => l.content) })
  const crit = await agent(`${base}\n\nKnowledge captured so far:\n${have}\n\nYou are a completeness critic. Look at the changed files and decisions: is anything material undocumented? A changed file or subsystem with no insight; a decision with no rationale captured; a non-obvious gotcha. Return concrete suggestions ONLY for genuine gaps (kind=insight|lesson). If nothing material is missing, set done=true and missing=[].`,
    { label: `critic:r${round + 1}`, phase: 'Critic', schema: CRITIC })
  if (!crit || crit.done || !crit.missing.length) { dry++; continue }
  for (const m of crit.missing) {
    if (m.kind === 'lesson') lessons.push({ outcome: 'unknown', content: m.suggestion, scope: m.scope || [] })
    else insights.push({ insightType: 'learning', content: m.suggestion, scope: m.scope || [], confidence: 'inferred' })
  }
  log(`critic round ${round + 1}: +${crit.missing.length} items`)
}

// ---- Phase 4: Verify — strategy chosen by task complexity ------------------
// FULL = one adversarial skeptic per candidate (max rigor, ~1 agent/item).
// LITE = a single batched verifier over all candidates (~40% cheaper).
// AUTO = LITE only when the task is low-complexity AND few candidates; else FULL.
phase('Verify')
const candidates = [
  ...insights.map((x, i) => ({ kind: 'insight', i, text: x.content })),
  ...lessons.map((x, i) => ({ kind: 'lesson', i, text: x.content })),
]
const useFull = MODE === 'full'
  || (MODE === 'auto' && (ctx.complexity !== 'low' || candidates.length > LITE_MAX_CANDIDATES))
log(`verify strategy: ${useFull ? 'FULL (per-candidate skeptics)' : 'LITE (batched)'} · mode=${MODE} · complexity=${ctx.complexity} · ${candidates.length} candidates`)

let keep
if (useFull) {
  const verdicts = await parallel(candidates.map(cnd => () =>
    agent(`Task ${TASK_ID} context:\n${CTXJSON}\n\nCandidate ${cnd.kind}: "${cnd.text}"\n\nBe skeptical. Is this SPECIFIC and traceable to an actual changed file or decision in the context — or is it generic filler that would apply to any task? Default grounded=false unless you can point to the evidence.`,
      { label: `verify:${cnd.kind}:${cnd.i}`, phase: 'Verify', schema: VERDICT })
      .then(v => ({ ...cnd, grounded: v && v.grounded }))))
  keep = verdicts.filter(Boolean).filter(v => v.grounded)
} else {
  const list = candidates.map((c, idx) => `[${idx}] (${c.kind}) ${c.text}`).join('\n\n')
  const batch = await agent(`Task ${TASK_ID} context:\n${CTXJSON}\n\nReview each candidate below. For EACH, decide if it is SPECIFIC and traceable to an actual changed file or decision in the context, or generic filler. Default grounded=false unless you can point to the evidence.\n\n${list}`,
    { label: 'verify:batch', phase: 'Verify',
      schema: { type: 'object', additionalProperties: false, required: ['verdicts'],
        properties: { verdicts: { type: 'array', items: { type: 'object', additionalProperties: false,
          required: ['index','grounded'], properties: {
            index: { type: 'number' }, grounded: { type: 'boolean' }, reason: { type: 'string' } } } } } } })
  const ok = new Set((batch && batch.verdicts || []).filter(v => v.grounded).map(v => v.index))
  keep = candidates.filter((_, idx) => ok.has(idx))
}
const keepIns = new Set(keep.filter(v => v.kind === 'insight').map(v => v.i))
const keepLes = new Set(keep.filter(v => v.kind === 'lesson').map(v => v.i))
insights = insights.filter((_, i) => keepIns.has(i))
lessons  = lessons.filter((_, i) => keepLes.has(i))
const dropped = candidates.length - keep.length
log(`verified: kept ${insights.length} insights + ${lessons.length} lessons, dropped ${dropped} as ungrounded`)

// ---- Phase 5: Persist (or dry-run print) -----------------------------------
phase('Persist')
const sh = s => `'${String(s).replace(/'/g, `'\\''`)}'`        // single-quote-safe shell arg
const scopeArgs = arr => (arr || []).map(s => `--scope ${sh(s)}`).join(' ')
const tagArgs = arr => (arr || []).map(s => `--tag ${sh(s)}`).join(' ')
const roomArg = r => (r && String(r).trim() && r !== 'commons') ? `--room ${sh(r)}` : ''
// agent-inferred room wins over brain's path-based derive_room default (which
// buries most knowledge in 'commons'). Same-type insights share one log-insight
// call (section-path collision workaround), so a group takes its MAJORITY room.
const majorityRoom = items => {
  const c = {}; for (const it of items) { const r = it.room; if (r) c[r] = (c[r] || 0) + 1 }
  let best = null, n = 0; for (const r in c) if (c[r] > n) { best = r; n = c[r] }
  return best
}
const cmds = []
// Group same-type insights into ONE call per type (numbered items in the content)
// for a compact, readable doc. (The old section-path collision that *forced* this
// grouping is fixed — create_insight_document now writes unique paths — but the
// grouping is kept intentionally. log-insight has no --scope; fold scope into the
// content and pass paths as tags.)
const byType = {}
for (const it of insights) (byType[it.insightType] = byType[it.insightType] || []).push(it)
for (const [type, items] of Object.entries(byType)) {
  const body = items.length === 1
    ? `${items[0].content}\n\nScope: ${(items[0].scope || []).join(', ')}`
    : items.map((it, n) => `${n + 1}. ${it.content}${(it.scope || []).length ? `\n   Scope: ${it.scope.join(', ')}` : ''}`).join('\n\n')
  const conf = items[0].confidence || 'inferred'
  const tags = [...new Set(items.flatMap(it => it.scope || []))]
  cmds.push(`~/.local/bin/brain log-insight -p ${PROJECT} --task-id ${TASK_ID} --type ${type} --confidence ${conf} ${roomArg(majorityRoom(items))} ${tagArgs(tags)} --content ${sh(body)} --json`)
}
for (const l of lessons)
  cmds.push(`~/.local/bin/brain log-lesson -p ${PROJECT} --task-id ${TASK_ID} --outcome ${l.outcome} --confidence observed ${roomArg(l.room)} ${scopeArgs(l.scope)} --content ${sh(l.content)} --json`)
if (plan)
  cmds.push(`~/.local/bin/brain log-plan -p ${PROJECT} --task-id ${TASK_ID} --title ${sh(plan.title)} --content ${sh(plan.content + '\n\n## Summary\n' + plan.summary)} --json`)
// `cmds` so far are the KNOWLEDGE writes — the count we verify before closing.
const knowledgeCount = cmds.length
const expectInsightGroups = Object.keys(byType).length
const expectLessons = lessons.length
// Maintenance, best-effort (failures here must NOT block the close): grow the
// taxonomy from 'other' items, then dedup so a PARTIAL RE-RUN of this capture
// (e.g. after a mid-persist crash) self-heals instead of leaving duplicates.
const maintCmds = [
  `~/.local/bin/brain rooms-evolve -p ${PROJECT} --json`,
  `~/.local/bin/brain lessons-dedup -p ${PROJECT} --json`,
  `~/.local/bin/brain insights-dedup -p ${PROJECT} --json`,
]

let persistResult, closeResult = { closed: false }
if (!PERSIST) {
  log(`DRY-RUN — ${knowledgeCount} knowledge + ${maintCmds.length} maintenance commands would run (nothing written). Set args.persist=true to execute.`)
  persistResult = { dryRun: true, wouldRun: [...cmds, ...maintCmds] }
} else {
  // 1) Persist knowledge + run maintenance. The agent reports logged/failed for
  //    the KNOWLEDGE commands only (maintenance is best-effort).
  const out = await agent(`Persist this task's captured knowledge to brain. Run these ${knowledgeCount} KNOWLEDGE commands first, in order, each prefixed with the env \`${ENVP}\`, one at a time; if one fails, report it and continue.\n\n${cmds.map((c, i) => `${i + 1}. ${ENVP} ${c}`).join('\n')}\n\nThen run these ${maintCmds.length} MAINTENANCE commands (best-effort — report but do not retry on failure):\n${maintCmds.map((c, i) => `${knowledgeCount + i + 1}. ${ENVP} ${c}`).join('\n')}\n\nDo NOT close or change the task's status — that is handled separately.\n\nReturn {logged, failed, details} counting ONLY the ${knowledgeCount} KNOWLEDGE commands.`,
    { label: 'persist', phase: 'Persist',
      schema: { type: 'object', additionalProperties: false, required: ['logged','failed','details'],
        properties: { logged: { type: 'number' }, failed: { type: 'number' }, details: { type: 'array', items: { type: 'string' } } } } })
  persistResult = out || { logged: 0, failed: knowledgeCount, details: ['persist agent returned null'] }
  log(`persisted: ${persistResult.logged}/${knowledgeCount} knowledge writes, ${persistResult.failed} failed`)

  // 2) VERIFY-BEFORE-CLOSE: never close on the agent's self-report alone. Query
  //    the DB for what actually landed; close ONLY if the real row counts cover
  //    what we tried to write (and nothing was reported failed). A mid-persist
  //    crash that logged 0 thus leaves the task OPEN for a clean re-run.
  if (CLOSE) {
    const verifyClose = await agent(`Verify task ${TASK_ID}'s knowledge actually persisted, then close the task ONLY if it did.\n\nSTEP 1 — count what landed (run exactly, parse JSON):\n\`\`\`\ncd ${BRAIN_REPO} && ${ENVP} .venv/bin/python -c "\nimport json\nfrom brain.cli import _get_client\nc=_get_client()\nrows=c.table('project_documents').select('doc_type,metadata').eq('project_id','${PROJECT}').execute().data or []\ndef mine(dt):\n    n=0\n    for r in rows:\n        if r.get('doc_type')!=dt: continue\n        m=r.get('metadata') or {}\n        if isinstance(m,str):\n            m=json.loads(m)\n        if m.get('primary_task_id')=='${TASK_ID}' or m.get('task_id')=='${TASK_ID}' or ('${TASK_ID}' in (m.get('task_ids') or [])):\n            if dt!='interaction_turn' or m.get('turn_kind')=='lesson': n+=1\n    return n\nprint(json.dumps({'insight_rows':mine('agent_insight'),'lesson_rows':mine('interaction_turn'),'plan_rows':mine('completed_plan')}))\n"\n\`\`\`\n\nSTEP 2 — decide. We expected at least ${expectInsightGroups} insight row(s) and ${expectLessons} lesson row(s)${plan ? ' and >=1 completed_plan row' : ''}. The persist step reported ${persistResult.failed} failed. CLOSE the task IFF (insight_rows >= ${expectInsightGroups}) AND (lesson_rows >= ${expectLessons})${plan ? ' AND (plan_rows >= 1)' : ''} AND (${persistResult.failed} == 0). If so, run:\n\`\`\`\n${ENVP} ~/.local/bin/brain taskstatus ${TASK_ID} --status done --json\n\`\`\`\nOtherwise DO NOT close — the persist was incomplete; leave it open for a re-run.\n\nReturn {insightRows, lessonRows, planRows, closed: boolean, reason: string}.`,
      { label: 'verify-close', phase: 'Persist',
        schema: { type: 'object', additionalProperties: false, required: ['insightRows','lessonRows','closed','reason'],
          properties: { insightRows: { type: 'number' }, lessonRows: { type: 'number' }, planRows: { type: 'number' }, closed: { type: 'boolean' }, reason: { type: 'string' } } } })
    closeResult = verifyClose || { closed: false, reason: 'verify-close agent returned null' }
    log(`verify: ${closeResult.insightRows ?? '?'} insight rows / ${closeResult.lessonRows ?? '?'} lessons → task ${closeResult.closed ? 'CLOSED (knowledge now global)' : 'LEFT OPEN: ' + (closeResult.reason || 'persist incomplete — re-run capture')}`)
  }
}

return {
  ok: true,
  task: { project: PROJECT, taskId: TASK_ID, goal: ctx.goal, repoFound: ctx.repoFound },
  verify: { mode: MODE, complexity: ctx.complexity, strategy: useFull ? 'full' : 'lite', candidates: candidates.length },
  captured: {
    insights: insights.map(i => ({ type: i.insightType, content: i.content, scope: i.scope })),
    lessons: lessons.map(l => ({ outcome: l.outcome, content: l.content, scope: l.scope })),
    plan: plan ? { title: plan.title, summary: plan.summary } : null,
  },
  droppedAsUngrounded: dropped,
  persist: persistResult,
  close: closeResult,
}
