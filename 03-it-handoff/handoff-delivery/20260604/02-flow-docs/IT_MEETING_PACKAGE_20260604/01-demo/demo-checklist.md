# Demo Checklist

## 1. Requester / Request Workspace

- Login as Requester.
- Open Request Workspace.
- Show Add / Reuse Item modal.
- Add an item to request.
- Open Edit Demand.
- Show Need Date.
- Show MFG station demand vs Non-MFG unit demand.
- Show optional line carryover input.
- Submit package to Manager B.

## 2. Manager B / Demand Analysis

- Login as Manager B.
- Open Approval.
- Show Pending Approval and Approval History.
- Open Demand Analysis.
- Show Cost Dashboard first.
- Show Department / Unit cost by phase.
- Show carryover cost compare and carryover ledger.
- Drill down to Station Matrix.
- Confirm Station Matrix remains Excel-like detail view.

## 3. OM Purchasing / Mai Assignment

- Login as OM Leader Mai.
- Open PAS Demand No.
- Show CPD-IEP Owner is business owner.
- Show Assigned To is OM work assignment.
- Assign a row to Giang or Linh.
- Login as OM Member.
- Show member can only operate assigned row.

## 4. OM Purchasing / PAS Quote Result

- Enter PAS Demand No.
- Move to PAS Quote Result.
- Enter PAS Material No, vendor, vendor part no, unit price, quote date, quote received date, quote valid until.
- Show quote validity stays inside quote result.
- Show price decision behavior:
  - Auto Cleared when within threshold.
  - DRI / Budget Approver review when over threshold or no history.

## 5. OM Purchasing / Export Package

- Show Export Package.
- Select Cost Type:
  - Expense -> ECS.
  - Capex -> CFA.
- Export Package as one action.
- Show package includes quote PDF and Excel metadata.

## 6. API / MySQL Phase 1

- Explain architecture: Browser -> Node API -> MySQL.
- Explain first implemented API scope:
  - login/logout/me.
  - OM assignees.
  - OM assignments.
  - audit events.
- Explain workflow data migration is Phase 2.

## Demo Notes

- This is a prototype plus Phase 1 API foundation.
- Demo data is used for visual validation.
- MySQL POC is intended for OM group internal test on Mac mini / internal LAN host.

