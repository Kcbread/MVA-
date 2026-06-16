# Context Loading Validator

Use this checklist when a future task feels slowed down by too much startup context.

| Check | Pass Criteria | Evidence |
|---|---|---|
| Task domain identified | The current request domain is clear enough to route context | user request, repo paths |
| Entrypoints read first | README / `_context/README` / relevant index read before deep files | file paths |
| No bulk-loading | Archives, old handoffs, generated outputs, and all skill bodies were not read without need | command output or receipt |
| Selected context justified | Role, flow, module, skill, or validator files were loaded because the task touched that area | file paths |
| Receipt compact | Startup receipt names evidence without repeating long policy text | final response or handoff |
| Execution label accurate | `mock`, `dry-run`, `fixture`, or `real execution` is named correctly | command output or artifact |
| Distillation recorded | If a rule feels reusable, it is captured as a candidate or concise installed rule | self-distillation path |

## Repair Prompt

If this checklist fails, reduce the mandatory startup surface:

1. Move detailed rationale into `project-progress/self-distillation/`.
2. Keep only trigger and routing rules in `AGENTS.md`.
3. Convert repeated manual checks into a validator or skill rather than adding more front matter.
