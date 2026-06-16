# AGENTS.md Patch Candidate: Skill Fit Scan Before Work

Status: candidate only. Do not apply without Kai's approval.

## Proposed Section

```md
## Skill And MCP Fit Scan Before Work

For every non-trivial task, perform a lightweight capability fit scan before planning or implementation:

1. Classify the request domain: code, test/debug, UI/Figma, docs, spreadsheet, presentation, image, OpenAI API/docs, database/Supabase, GitHub/CI, security, external app action, skill/plugin work, PM memory/handoff, or unknown.
2. Check relevant installed capability metadata before improvising:
   - personal skills: `~/.codex/skills/<skill-name>/SKILL.md`
   - system skills: `~/.codex/skills/.system/**/SKILL.md`
   - OpenAI/plugin skills: `~/.codex/plugins/cache/**/skills/**/SKILL.md`
   - currently exposed MCP/app tools
3. Rank 3-7 likely skills/MCPs by trigger fit, task-domain fit, local availability, project-rule overlap, and permission risk.
4. Load the full `SKILL.md` only for selected skills before acting.
5. State a compact routing receipt when it affects the plan:
   - selected skill(s) or MCP(s)
   - why selected
   - obvious alternatives skipped
   - permission/risk label
   - evidence paths
6. For external or third-party skill installation, verify that the target is a Codex `SKILL.md` directory before installing. If feasible, scan or inspect it first. Do not install items flagged `DO_NOT_INSTALL` by a security scanner unless Kai explicitly approves the override.
7. Distinguish `mock`, `dry-run`, `fixture`, and `real execution`; never describe mock or dry-run validation as real completion.
```

## Acceptance Criteria

- Future non-trivial requests mention or internally apply skill/MCP routing before implementation.
- The response identifies high-risk remote-write tools before use.
- Third-party skill installation verifies `SKILL.md` existence and source path freshness.
- Obvious skill misses are recorded as self-distillation candidates.

## Rollback

Remove this section from `AGENTS.md` if it creates too much response overhead or conflicts with a more specific project rule.

