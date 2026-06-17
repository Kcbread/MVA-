# OM QA Daily Patch Note Workflow

This folder stores OM QA daily patch-note decks and the intake ledger generated
from PowerPoint comments.

## Daily Rule

- Keep the previous PPTX unchanged.
- Generate a new daily PPTX using `YYYYMMDD System feedback patchnote.pptx`.
- Treat PowerPoint comments as draft feedback, not confirmed fixes.
- Kai confirms one item at a time before implementation.
- The final OM-facing PPT should explain:
  - Feedback
  - Change Made
  - How to Retest
  - Evidence Screenshot
  - Status

## Generate Daily Intake

From the repo root:

```bash
python3 "02-oa-internal-test/Patchnote /tools/om_patchnote_workflow.py" \
  --source "02-oa-internal-test/Patchnote /2026617 System feedback .pptx" \
  --output-dir "02-oa-internal-test/Patchnote " \
  --date 20260617
```

Outputs:

- `YYYYMMDD System feedback patchnote.pptx`
- `YYYYMMDD OM QA patchnote intake.md`
- `YYYYMMDD OM QA patchnote intake.csv`

## Status Meaning

- `Need Kai Confirmation`: likely actionable, but still draft until Kai confirms
  the exact expected behavior.
- `Question/Clarification`: needs scope or business-rule clarification before
  implementation.
- `Confirmed Fix`: only use after Kai confirms the exact fix instruction and
  verification evidence is available.
- `Not Product Change`: training, test data, prototype-only note, or feedback
  collection artifact.

## Verification

For PPT/intake-only updates:

```bash
python3 -m unittest "02-oa-internal-test/Patchnote /tests/test_om_patchnote_workflow.py"
```

For prototype code changes, also run:

```bash
cd 05-engineering-source/procurement-prototype
./test.sh
```

Browser/accessibility checks that are skipped must be marked as skipped, not
passed.
