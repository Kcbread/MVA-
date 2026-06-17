# Product System Entry

Use this folder for the current PM-owned product map of the MVA procurement
prototype. It ties together business-facing features, concrete functions,
source modules, roles, permissions, workflow statuses, and local file ownership.

## Current Documents

| Purpose | File |
| --- | --- |
| Global feature / function / module / role / permission map | `GLOBAL_PRODUCT_MAP_20260617.md` |
| Local folder and document ownership logic | `LOCAL_FILE_LOGIC_20260617.md` |

## Source Boundary

- Product truth starts at `../../05-engineering-source/procurement-prototype/_context/`.
- Locked decisions live in `../../05-engineering-source/procurement-prototype/PROJECT_DECISIONS.md`.
- Patch-note evidence lives in `../../02-oa-internal-test/Patchnote /`.
- IT-facing handoff docs live in `../../03-it-handoff/`.
- This folder is the PM synthesis layer. It does not replace the engineering
  source or role/flow/module context files.

## Operating Rule

Every future global consolidation should cover all six layers together:

```text
Feature -> Function -> Module -> Role -> Permission -> Workflow Status
```

Do not publish a module-only map as the product source of truth.
