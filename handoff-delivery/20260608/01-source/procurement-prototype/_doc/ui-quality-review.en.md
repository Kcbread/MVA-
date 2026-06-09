# UI Quality Review Standard

## Core Questions

Every OPM, Manager B, and OM Purchasing UI change must answer four questions:

- Can the eye find the main point?
- After seeing it, can the user understand it?
- After understanding it, is the next action obvious?
- Is the visual language consistent?

## Readability

- Use Flesch-Kincaid as a reference for English copy: short sentences, low jargon, and no long paragraphs in table cells.
- Do not force Flesch-Kincaid onto Traditional Chinese or mixed Chinese/English UI. Check sentence length, consistent field naming, acronym clarity, and action verb clarity instead.
- Long spec, purpose, and remark text should be summarized in cells and expanded in Detail, tooltip, or modal.
- Action buttons must use clear verbs such as `Submit`, `Approve`, `Send to User A`, and `Save Quote Info`.

## WCAG 2 Checks

- Text and background need sufficient contrast.
- Inputs, selects, and textareas need labels or understandable aria labels.
- Keyboard focus must be visible.
- Modals must support Close, Esc, and backdrop close without focus confusion.
- Tables need clear headers, especially Excel-like wide matrices.
- Error and disabled states need text reasons, not color alone.

## Attention Heatmap

- The first visual area should show the role's current job.
- OPM first focus: add, reuse, draft, submit.
- Manager B first focus: Excel Dashboard-like cost/qty view, then drill into Station Matrix.
- OM Purchasing first focus: received date, current stage, days in stage, and next action.
- Contact, raw Excel source, long history, and secondary explanation belong in Detail or popup.

## Manager B Exception

Manager `Station Matrix` and `Cost Dashboard` are intentional Excel-like high-density exceptions. They should not be redesigned as card dashboards.

`Demand Analysis > Cost Dashboard` must follow the Excel `Dashboard` sheet columns:

- `ENG Name`
- `CN-ENG Name`
- `VN Name`
- `Price`
- `MFG`
- `FATP TE`
- `FATP IQC`
- `FATP PQE`
- `WH`
- `Q-LAB`
- `REL`
- `ENG1`
- `ENG2`
- `ENG3`
- `IT`
- `FAC`

Do not reintroduce low-value summary cards such as `Highest Unit`, `Highest Item`, or `Price Pending` summary.

## Standard Report

```text
UI Quality: pass/fail
Readability: pass/fail + note
WCAG Smoke: pass/skipped/fail + reason
Attention Flow: pass/fail + first-focus note
Action Clarity: pass/fail + primary action note
Consistency: pass/fail + mismatch note
```
