# Data Flow And Closed Loop

## Architecture

```text
Browser frontend -> Node.js API -> MySQL
```

The browser must never connect directly to MySQL.

## Canonical Workflow Data

The target system must preserve these canonical fields across frontend, API, DB, audit, and reports:

- quantity
- phase
- MFG station or Non-MFG demand unit
- currency
- canonical price
- quote price
- carryover status
- approval status
- current workflow owner
- current workflow stage
- stage start date and days pending

## Workflow Status Model

Every role status table should derive from one model:

- pendingOwner
- currentStage
- submittedAt
- receivedAt
- stageStartAt
- daysPending
- nextAction
- riskReason
- timelineMilestones
- visibilityFlags

## Closed-Loop Requirement

No business action may leave a row without a next owner.

Examples:

- Reject creates reason + previous stage + next owner.
- Amendment keeps previous quote as reference but not active quote.
- Budget Approver reject returns to Requester Action Required.
- OM export creates Buyer Handoff owner and timestamp.
- Warehouse/carryover pending candidate remains evidence until Dept DRI locks it.

## Attachment Flow

Attachment v1 uses local file storage plus DB metadata:

- file id
- linked entity type/id
- original file name
- stored file path or storage key
- MIME type
- size
- uploaded by
- uploaded at
- uploaded role
- visibility scope

Download API must enforce role visibility.
