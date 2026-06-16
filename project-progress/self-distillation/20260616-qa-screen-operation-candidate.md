# QA Briefing Screen Operation Candidate

Status: candidate rule, not installed into formal project instructions.
Date: 2026-06-16

## Trigger

When Kai asks for material for `QA`, `QA 人員`, QA briefing, QA handoff, QA patch notes, or QA-oriented PPT.

## Candidate Rule

Include actual screen operation content by default:

- Entry role and login context.
- Navigation path from the visible UI.
- Click sequence or operation sequence.
- Expected visible state after each operation.
- Pass/fail signal for QA.
- WIP boundary when implementation is still in progress.
- Real screenshots when a local prototype can be opened; otherwise mark `evidence_missing`.

## Evidence From This Task

- Real WIP screenshots captured from the local prototype:
  - `outputs/019ece60-4529-7041-9c0b-7c8ac180499e/presentations/allocate-pitch/assets/qa-screen-01-my-exports.png`
  - `outputs/019ece60-4529-7041-9c0b-7c8ac180499e/presentations/allocate-pitch/assets/qa-screen-02-allocation-workspace.png`
  - `outputs/019ece60-4529-7041-9c0b-7c8ac180499e/presentations/allocate-pitch/assets/qa-screen-03-validation-block.png`
- Presentation slides 08-10 were added specifically for screen operations.

## Installation Note

Do not directly overwrite `AGENTS.md` or formal skills without Kai's explicit approval. Promote this candidate only after Kai confirms this should become a formal workspace rule.
