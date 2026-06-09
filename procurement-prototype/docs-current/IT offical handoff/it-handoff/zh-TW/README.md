# IT 交付文件 - 繁體中文

本資料夾是 2026-06-08 交付 IT 使用的正式模組化規格。

## Scope

本輪展開下列角色與接點：

- `Requester`
- `Cost Manager`（部分舊檔仍可見 legacy label：`Manager B`）
- `Dept DRI`
- `Budget Approver`
- `OM Purchasing`
- `Buyer Handoff`

MFG Coordinator、Sourcing、Buyer 只在跨流程接點中出現，不在本輪展開完整模組。

## 文件順序

1. [`../../IT_DELIVERY_READINESS_20260608.md`](../../IT_DELIVERY_READINESS_20260608.md)：交付總表與最新版狀態。
2. [`00-naming-rules.md`](./00-naming-rules.md)：命名規則。
3. [`01-module-catalog.md`](./01-module-catalog.md)：可重用模組目錄。
4. [`02-requester-modules.md`](./02-requester-modules.md)：Requester 模組。
5. [`03-manager-b-modules.md`](./03-manager-b-modules.md)：Cost Manager / legacy Manager B 模組。
6. [`04-om-purchasing-modules.md`](./04-om-purchasing-modules.md)：OM Purchasing 模組。
7. [`05-cross-role-flow.md`](./05-cross-role-flow.md)：跨角色流程。
8. [`06-table-information-flow.md`](./06-table-information-flow.md)：表格資訊流。
9. DFD 視覺檔：`../IT_MEETING_PACKAGE_20260604/04-dfd/` 只作歷史會議輔助。

## 使用原則

- IT 開發時以本資料夾命名為準。
- 若舊文件與本資料夾衝突，以本資料夾為準。
- Requester 最新輸入規則是整頁 All-Phase Excel worksheet，不是 Source Panel、Add Demand modal 或 Demand Editor 主輸入。
- DFD 視覺化若與本資料夾衝突，以本資料夾文字規格為準。
