# OM QA Patch Note Intake - 20260617

## Summary

- Source PPT: `2026617 System feedback .pptx`
- Daily PPT output: `20260617 System feedback patchnote.pptx`
- Extracted comments: 7
- Need Kai Confirmation: 6
- Question/Clarification: 1
- Confirmed Fix: 0 (comments are treated as draft until Kai confirms each item)

## Pending Confirmation

| ID | Slide | Reporter | Inferred Screen | Status | Owner | Comment | Confirmation Needed |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| OM-QA-20260617-001 | 7 | Steven Yang | Prototype-only UI cleanup | Need Kai Confirmation | Kai | will removed | Confirm this is prototype-only UI and safe to remove. |
| OM-QA-20260617-002 | 7 | Steven Yang | OM Purchasing Process Status | Need Kai Confirmation | Kai + OM Team | Purchasing process status –Pending/Done of bidding/Budget/ PR /PO/shipping. right here this is current pending status | Confirm exact UI/behavior change before implementation. |
| OM-QA-20260617-003 | 7 | Steven Yang | OM Assignment Control | Need Kai Confirmation | Kai + OM Leader | Assigned to Giang | Confirm exact UI/behavior change before implementation. |
| OM-QA-20260617-004 | 7 | Steven Yang | OM Submission Dashboard | Need Kai Confirmation | Kai + OM Leader | project filter right here , item I will make | Confirm exact UI/behavior change before implementation. |
| OM-QA-20260617-005 | 7 | Steven Yang | OM Export / filtered request output | Deferred / Needs field + permission definition | Kai + OM Leader | Can export excel file for total requests/ filter requests Steven : You mean after you custom the filter you want to export as CSV Such as : IPC A++ : pending at which project P26 line 1 : total pending items Let me know I will see if possible | Deferred from first fix package; define export fields, filtered-row scope, and OM Leader vs OM Purchasing permission before implementation. |
| OM-QA-20260617-006 | 7 | Steven Yang | Prototype-only UI cleanup | Need Kai Confirmation | Kai + OM Leader | Will be removed , this is for gather feedback on prototype only | Confirm this is prototype-only UI and safe to remove. |
| OM-QA-20260617-007 | 8 | Steven Yang | OM Assignment Control | Need Kai Confirmation | Kai + OM Leader | directly assign -&gt;Yes , this is for you to adjust only , current role are P26 : Linh Other : Giang System didnt finalize , I will make adjust again | Confirm exact UI/behavior change before implementation. |

## Confirmed Fixes

| ID | Change Made | Evidence Screenshot | Verification | Residual Risk |
| --- | --- | --- | --- | --- |
| none yet | Waiting for Kai to confirm each fix instruction. | n/a | n/a | n/a |

## OM Retest Checklist

- [ ] Mai can review OM feedback and assignment-related changes.
- [ ] Giang/Linh only retest assigned-row behavior when a confirmed fix affects them.
- [ ] Each confirmed item has Feedback / Change Made / How to Retest / Evidence / Status in the daily PPT.
- [ ] Any skipped browser/accessibility check is explicitly marked as skipped, not passed.

## Notes

- This file is the daily intake ledger. The PPT is the OM-facing retest guide.
- Do not treat these comments as completed fixes until Kai confirms an item and verification evidence is attached.
