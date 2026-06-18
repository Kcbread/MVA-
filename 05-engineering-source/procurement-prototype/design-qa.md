**Findings**
- No P0/P1/P2 visual or workflow issues found for the OM Submission Dashboard scope filter update.
- Project View now removes item filtering and item-level grouping from the project pivot. The visible scope label reads `Project View · All projects pending`.
- Item View now exposes a staged LV123 filter path before Item selection: `LV1 -> LV2 -> LV3 -> Item`.

**Open Questions**
- none

**Implementation Checklist**
- Removed the visible `Item` filter from Project View by hiding the item-scope control group unless Item View is active.
- Added Item View controls for `LV1`, `LV2`, `LV3`, and `Item`.
- Wired cascading filter behavior so LV2 depends on LV1, LV3 depends on LV2, and Item enables only after LV3.
- Updated OM taxonomy lookup to support `omCategoryLevel1/2/3` rows, not only `level1/2/3` or `lv1/2/3`.
- Removed item from the Project View pivot key; Project View now aggregates at project/stage/department scope and summarizes the item mix.
- Kept Item View as the only item-level pivot.
- Updated the OM system contract test for the new scope boundary.

**Follow-up Polish**
- P3: If OM wants friendlier labels later, `LV1/LV2/LV3` can be renamed to business-facing taxonomy labels without changing the behavior.

source visual truth path:
- `/var/folders/fq/t7kbchmx7wvfnvt7z5l13qy00000gn/T/TemporaryItems/NSIRD_screencaptureui_IaLICj/截圖 2026-06-18 上午10.08.51.png`

implementation screenshot paths:
- `/Users/kai-chenyang/Desktop/桌面 - Kai-chen的MacBook Pro/Codex/資料庫建置/05-engineering-source/procurement-prototype/test-artifacts/om-submission-project-filter-after.png`
- `/Users/kai-chenyang/Desktop/桌面 - Kai-chen的MacBook Pro/Codex/資料庫建置/05-engineering-source/procurement-prototype/test-artifacts/om-submission-item-filter-after.png`

viewport: 2048x520
state: OM Leader workspace, `OM Purchasing` view, `Submission Dashboard` panel

full-view comparison evidence:
- Source screenshot showed Project View with a visible `Item` dropdown and scope text `Project View · All projects · All items pending`.
- Implementation Project View screenshot shows no visible LV/item controls and scope text `Project View · All projects pending`.
- Implementation Item View screenshot shows `LV1`, `LV2`, `LV3`, and `Item` controls in sequence.

focused region comparison evidence:
- Project View toolbar verified through Playwright real execution: `data-om-item-scope` controls are hidden, 98 OM submission rows render, and page-level overflow is false.
- Item View toolbar verified through Playwright real execution: after selecting `Information network / Barcode equipment/accessories/consumables / Barcode printer`, LV2, LV3, and Item controls are enabled, Item has 4 options, and page-level overflow is false.

required fidelity surfaces:
- Fonts and typography: existing toolbar label, segmented control, select labels, and scope label typography are preserved.
- Spacing and layout rhythm: OM toolbar uses responsive `auto-fit` grid tracks so Project View and Item View fit without overflow.
- Colors and visual tokens: existing tokenized toolbar background, border, select, and active segment styling are preserved.
- Image quality and asset fidelity: no image assets were introduced or replaced.
- Copy and content: Project View no longer says `All items pending`; Item View explicitly communicates the LV123 path before item selection.

patches made since previous QA pass:
- Updated `index.html` OM Submission toolbar controls and initial Project View scope label.
- Updated `app.js` OM submission taxonomy helper, item-scope filtering, project/item pivot key behavior, group item summary, clear-filter behavior, and change listeners.
- Updated `styles.css` OM toolbar filter grid to support Project and Item scope layouts.
- Updated `tests/system-contract.test.js` OM contract coverage.

validation:
- `node --check app.js`: passed.
- `node --test --test-name-pattern "OM tabs" tests/system-contract.test.js`: passed, 1/1.
- Playwright render check for Project View and Item View filter states: passed.
- `./test.sh`: partial failure. Syntax, unit/system tests, browser smoke, layout smoke, price routing smoke, and global UI audit passed; final role-flow smoke failed on unrelated Cost Review focused matrix selected-line behavior.

final result: passed
