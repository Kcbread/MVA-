# Table and Button Layout Standard

## Field Classification

Every table column must be classified before styling.

- `Identity`: item name + Factory Material No, Request ID, PAS Demand No, PAS Material No, Package Code, PO No, contact name/email. These must not be hidden by generic clamp rules.
- `Spec`: product specification. Show a 2-3 line summary in the main table and keep the full text in Detail, tooltip, or row expand.
- `Note`: purpose, remark, pending reason. Show a short table summary and keep full text in Detail.
- `Number`: qty, price, amount, percent. Do not wrap; use compact format when needed.
- `Action`: table buttons must use short labels such as `Add`, `Edit`, `Remove`, `Detail`, and `Export`.

## Mandatory Rules

- Do not apply `display: -webkit-box` to the `td` itself.
- Clamp only an inner text wrapper.
- Identity fields must not use generic `.cell-text-clamp`.
- Long specs may be summarized, but full content must be reachable.
- Wide tables must scroll inside `.table-shell`; they must not create page-level overflow.

## Examples

- Correct: `Mini PC (Assy)` + `FM-VN-MVA-6D0F200` are both readable.
- Incorrect: the factory material number is clipped or hidden.
- Correct: `LAMITOUCH LM-30 CPU:i3-6100, RAM 16GB...` appears as a readable summary with full text in Detail.
- Incorrect: the spec is hard-cut mid-token with no full-text path.
