# Skill Routing Validator Candidate

Use this checklist before final response on non-trivial tasks.

| Check | Pass Criteria | Evidence |
|---|---|---|
| Task domain classified | Domain is named or obvious internally | user request, repo paths |
| Candidate capabilities scanned | 3-7 likely skills/MCPs considered, or reason tiny task skipped | `~/.codex/skills`, plugin skill metadata, tool list |
| Selected skills loaded | Full `SKILL.md` read for each selected skill | skill path |
| Obvious alternatives handled | Relevant skipped skills/MCPs have a reason | receipt or final note |
| Permission risk labeled | local-only, external-read, external-write, destructive, or high-risk | tool/source path |
| Execution label accurate | mock/dry-run/fixture/real execution correctly stated | command output, file path, remote URL |
| Verification performed | relevant test, scan, smoke check, or explicit not-run reason | command output, report path |
| Distillation check complete | reusable workflow or no-distillation decision recorded | final response or receipt |

## Scoring

- 8/8: ready
- 6-7/8: acceptable if gaps are disclosed
- 4-5/8: repair before final response
- 0-3/8: stop and rerun capability fit scan

## Repair Prompts

- "Which installed skill/MCP directly matches this request?"
- "Did I read the selected `SKILL.md` before acting?"
- "Is any external account, remote write, payment, publishing, deletion, production data, or customer contact involved?"
- "Am I labeling a dry-run or static scan as real execution?"
- "What evidence path supports the claim?"

