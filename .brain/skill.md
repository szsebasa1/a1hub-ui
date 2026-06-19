---
name: brain-workflow
description: MCP workflow for a1hub-ui using dev-brain semantic memory
---

# Brain MCP Workflow

## Session Start

1. Call `brain_new_task` or `brain_resume` to initialize context
2. Review permanent preferences and retrieved context
3. Use `brain_retrieve_context` to page through lazy-loaded results

## During Work

- `brain_retrieve` for semantic search across docs and code
- `brain_session update --decision "..."` for key decisions
- `brain_session update --add-file "path/to/file"` for file tracking
- `brain_log_insight` for findings, mistakes, discoveries worth remembering
- `brain_log_plan` when a plan is finalized

## Session End

1. `brain_session end` to close the session
2. Optionally `brain_ingest_code` to re-index changed code

## Task IDs

- Format: `HUBUI-NNN` (auto-incremented)
- Use `brain_next_task_id` to get the next ID without starting a session

## Health Check

- `brain_health` to verify Supabase, Ollama, and ML Studio connectivity
