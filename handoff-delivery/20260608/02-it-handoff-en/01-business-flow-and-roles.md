# Business Flow And Role Ownership

## Standard Business Flow

1. **Requester** creates demand.
   - Selects MFG or Non-MFG.
   - MFG uses line, stage, station, item, quantity, and need date.
   - Non-MFG uses demand unit, item, quantity, and need date.
2. **Requester** submits package.
3. **Dept DRI** reviews requester submission.
   - Approve -> Cost Manager.
   - Reject -> Requester Action Required.
4. **Cost Manager** performs final authorization.
   - Approve -> OM Leader intake/assignment.
   - Reject -> Requester Action Required.
5. **OM Leader** assigns OM work.
   - Linh owns P27/F27 by default.
   - Giang owns other projects by default.
   - Mai can adjust assignment.
6. **OM Purchasing** operates assigned rows.
   - PAS Demand No.
   - PAS Quote Result.
   - Quote Expiry tracking.
   - Export Package.
7. **Buyer Handoff** starts after OM export.
   - Buyer owns PR/PO after OM export.
   - UI must say Buyer Handoff, not vague downstream wording.

## Reject Loop

Every reject must preserve:

- reason
- timestamp
- actor
- previous stage
- next owner

Reject routes:

- Dept DRI reject -> Requester Action Required -> revise/resubmit -> Dept DRI.
- Cost Manager reject -> Requester Action Required -> revise/resubmit -> Dept DRI.
- OM reject -> Requester Action Required or Dept DRI review, depending on reason.
- Budget Approver reject -> Requester Action Required.

## Price Exception Loop

Price exception uses absolute USD delta:

```text
rounded(quoteUnitPriceUsd - historyUnitPriceUsd, 2) > 0.40
```

- `<= 0.40 USD`: Auto Cleared, no Requester confirmation, move to OM Export Package.
- `> 0.40 USD`: Dept DRI price review -> Budget Approver -> OM Export Package.
- No history price, new item, and Temporary Budget always trigger review.

## Temporary Budget

Temporary Budget does not go directly to Budget Approver at submission time:

1. Requester enters estimate and reason.
2. Dept DRI submission review.
3. Cost Manager final authorization.
4. OM quote result.
5. Dept DRI quote review.
6. Budget Approver final approval.
7. OM Export Package.

## Warehouse And Carryover

Warehouse and carryover are ledgers, not silent quantity overrides.

- Requester can create evidence/candidate.
- Dept DRI locks or rejects.
- Pending candidate does not reduce official cost.
- Locked/applied ledger events affect effective quantity/cost.
- Cost Manager views original/saving/effective values.
- OM consumes effective quantity only.
