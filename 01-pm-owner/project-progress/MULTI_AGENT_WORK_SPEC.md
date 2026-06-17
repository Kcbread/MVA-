# Multi-Agent Work Spec

Updated: 2026-06-16

## Purpose

This document defines when Codex should proactively use subagents in this
workspace, how to split work safely, and how to integrate results without
delegating product decisions away from the main thread.

## Auto-Start Rule

Codex should consider starting subagents without asking for separate permission
when all of the following are true:

1. The user request is material, non-trivial, and would benefit from parallel
   research, implementation, or verification.
2. The work can be split into independent tasks with clear ownership.
3. The subagent task can run without making external writes, deployments,
   purchases, customer contact, production-data changes, or destructive cleanup.
4. The main thread can keep ownership of decisions, integration, validation, and
   final reporting.

Codex should not start subagents automatically when the next step is a single
blocking decision, a tightly coupled bug, a tiny command, or a task where agents
would edit overlapping files.

## Startup Gate

Before spawning agents for this procurement workspace, the main thread must:

1. Pass the normal project startup gate from `AGENTS.md`.
2. Inspect `git status --short --branch` before any material edit.
3. Identify affected roles, flows, modules, and source-of-truth documents.
4. Decide which work stays local on the critical path.
5. Assign each subagent a bounded scope, expected output, and risk label.

Subagents should receive only the context needed for their bounded task. They
must be told they are not alone in the codebase and must not revert or overwrite
unrelated changes.

## Agent Types

Use `explorer` agents for read-only questions such as:

- Which role files own a behavior?
- Which flow or module docs constrain this change?
- Which tests cover a feature or failure?
- Where are similar UI, API, or validation patterns implemented?

Use `worker` agents for bounded code or document changes when write ownership is
clear and disjoint, such as:

- One role screen or module slice.
- One test file or fixture area.
- One document/spec update.
- One validator or script with isolated inputs and outputs.

Use verifier-style tasks when a read-only check can run in parallel with local
work, such as:

- Role and permission exposure checks.
- UI field visibility checks.
- Mock/dry-run/fixture versus real execution labeling.
- Regression-risk scan against project rules.

## Splitting Rules

Good splits have:

- Disjoint write sets.
- A concrete acceptance condition.
- A short list of files or directories in scope.
- A clear "do not change" boundary.
- A handoff format the main thread can review quickly.

Bad splits include:

- "Fix everything."
- "Research the whole repo."
- Multiple workers editing the same screen, file, or business rule.
- Delegating product ownership, role policy, or locked decisions.
- Asking a subagent to perform remote writes without explicit human approval.

## Prompt Template

```text
You are a subagent in the MVA procurement workspace.

Task:
- <bounded task>

Context to read:
- <specific files only>

Scope:
- You may read: <paths>
- You may edit: <paths, or read-only>
- Do not edit: <paths / behavior>

Project rules:
- Follow AGENTS.md and 05-engineering-source/procurement-prototype/_context/README.zh-TW.md.
- You are not alone in the codebase. Do not revert unrelated changes.
- Do not make external writes, deployments, deletes, or production-data changes.
- Do not decide product ownership. Escalate ambiguity to the main thread.

Return:
- Findings
- Changes
- Validation
- Risks / gaps
- Files changed
```

## Integration Rules

The main thread must:

1. Review every subagent result before treating it as accepted.
2. Check for overlapping file changes or conflicting conclusions.
3. Run the relevant validation locally after integration.
4. Distinguish real execution from mock, fixture, and dry-run results.
5. Produce the normal final receipt with evidence paths.

Subagent findings are evidence candidates, not final truth, until reviewed by
the main thread against repo files, test output, screenshots, commits, or other
reviewable artifacts.

## Permission And Risk Labels

Use these labels when planning or reporting multi-agent work:

- `local-read`: reads local files only.
- `local-write`: edits local repo files only.
- `external-read`: reads connected services such as Notion, GitHub, Google
  Drive, Gmail, or Calendar.
- `external-write-approval-needed`: would update, publish, delete, deploy,
  purchase, change production data, change pricing/inventory, or contact people.

Agents may perform `local-read` and scoped `local-write` tasks when the user has
asked for implementation. `external-write-approval-needed` requires explicit
human authorization before real execution.

## Receipt Add-On

When subagents are used, add this to the final or handoff receipt:

```text
Multi-Agent Receipt
Agents: <count and types>
Local main-thread work: <what stayed local>
Delegated work: <agent id/name, scope, status>
Integration: <accepted / revised / rejected>
Validation: <real execution / dry-run / fixture / not run>
Risks: <remaining risk or none>
Evidence: <paths, outputs, screenshots, commits, or evidence_missing>
```

## Self-Distillation Hook

After any material multi-agent run, Codex should check whether the split,
handoff, validator, or prompt template should be improved. Candidate
improvements should be proposed first, not silently installed into global rules
or skills.
