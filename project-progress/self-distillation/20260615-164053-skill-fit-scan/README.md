# Skill Fit Scan Self-Distillation Receipt

Date: 2026-06-15
Task level: L3 Distillation Task
Status: candidate generated, not formally installed

## Task

Kai asked Codex to distill the recent skill installation work so future requests start with an intentional self-check for relevant skills, MCPs, plugins, and risk boundaries.

## Evidence

- Project root: `/Users/kai-chenyang/Desktop/桌面 - Kai-chen的MacBook Pro/Codex/資料庫建置`
- Startup files read in this thread:
  - `README.md`
  - `procurement-prototype/_context/README.zh-TW.md`
  - `/Users/kai-chenyang/.codex/skills/.system/skill-installer/SKILL.md`
  - `/Users/kai-chenyang/.codex/skills/project-startup-scan/SKILL.md`
  - `/Users/kai-chenyang/.codex/skills/self-distillation/SKILL.md`
- Installed skill inventory evidence:
  - `/Users/kai-chenyang/.codex/skills/*/SKILL.md`
  - `/Users/kai-chenyang/.codex/skills/.system/*/SKILL.md`
- SkillSpector scan reports from the CSDN/openEuler skill install task:
  - `/tmp/skillspector-csdn-skills/*.json`
- Git worktree evidence:
  - `git status --short --branch` showed no project-file changes before this candidate output directory was created.

## Findings

1. The project already has strong startup requirements in the user-provided instructions and workspace README, but future requests need an explicit "skill fit scan" step before choosing an approach.
2. The recent install task showed that an article can mention outdated skill paths. Evidence: `create-plan` and `frontend-skill` were not found in the current `openai/skills` inventory during the install task.
3. A GitHub repo with "skill" in its name may be a CLI/package rather than a Codex `SKILL.md` skill. Evidence: `NVIDIA/SkillSpector` had `pyproject.toml` and Python package files, but no root `SKILL.md`.
4. Third-party skills should be scanned or reviewed before install when feasible. Evidence: `SkillSpector --no-llm` marked several requested skills as `CRITICAL / DO_NOT_INSTALL`.
5. Installed skills now materially expand the routing surface, especially for CLI creation, Figma implementation, external app connection, security threat modeling, planning, verification, and development workflows.

## Reusable Workflow

For every non-trivial future request:

1. Classify the task domain:
   - code change, test/debug, UI/Figma, docs, spreadsheet, presentation, image, OpenAI API/docs, database/Supabase, GitHub/CI, security, external app action, skill/plugin work, PM memory/handoff, or unknown.
2. Scan candidate capabilities without bulk-loading all skill bodies:
   - personal skills: `~/.codex/skills/<skill-name>/SKILL.md`
   - system skills: `~/.codex/skills/.system/**/SKILL.md`
   - plugin/OpenAI skills: `~/.codex/plugins/cache/**/skills/**/SKILL.md`
   - active MCP/app tools exposed in the session
3. Rank 3-7 likely skills/MCPs:
   - direct trigger match
   - task-domain fit
   - freshness/local availability
   - overlap with project rules
   - permission or remote-write risk
4. Load the full `SKILL.md` only for selected skills before acting.
5. State or internally record a concise routing receipt:
   - selected skill(s)
   - why they apply
   - why obvious alternatives were skipped
   - permission/risk label
   - evidence paths
6. Before installing or using remote-write capabilities, classify execution:
   - `mock`
   - `dry-run`
   - `fixture`
   - `real execution`
7. End with a lightweight self-distillation check:
   - reusable workflow?
   - repeated failure mode?
   - missing validator?
   - missing skill?
   - candidate project/global rule?

## Priority Matrix

| Priority | Candidate | Reason | Status |
|---|---|---|---|
| P0 | Add skill-fit scan receipt before non-trivial work | Directly addresses Kai's request and reduces missed skill use | Candidate created |
| P0 | Treat external skill installs as verify-before-install | Recent install found outdated paths and high-risk scans | Candidate created |
| P1 | Add a compact skill routing template to project/global rules | Useful across future threads | Needs human approval |
| P1 | Create a wrapper skill for "skill-fit-router" | Could make the behavior more durable than prose | Candidate only |
| P2 | Periodically rescan installed skills for overlap/risk | Useful but not urgent | Observe |

## Validation Sample

Sample future request: "請幫我修 GitHub PR CI".

Expected routing:

- Candidate skills:
  - `gh-fix-ci` if installed and safe; currently not installed due SkillSpector `DO_NOT_INSTALL`.
  - GitHub plugin skill if available from plugin cache.
  - `receiving-code-review` only if the request is about review feedback.
  - `verification-before-completion` before claiming the fix is complete.
- Risk:
  - external-read for GitHub logs
  - local-write for code edits
  - external-write if pushing commits or creating PRs
- Required guardrail:
  - do not use a skipped third-party `gh-fix-ci` skill unless Kai explicitly approves installing or overriding the risk finding.

Validation result: ready as a routing rule candidate; not yet installed into `AGENTS.md`.

## Risks And Gaps

- This candidate is not a formal rule until installed into `AGENTS.md` or a dedicated skill.
- Installed skills may not be picked up by Codex until restart.
- `SkillSpector --no-llm` is static-only validation, not a full semantic review.
- Some plugin skills are available through plugin cache and may overlap with personal skills; future routing should prefer official/plugin capabilities when they are safer and better integrated.

## Next Recommendation

Install the `AGENTS_PATCH_CANDIDATE.md` section if Kai wants this behavior to become a durable project-level rule. For global behavior across all workspaces, turn the same content into a global `AGENTS.md` patch or a small personal `skill-fit-router` skill.

