# MVA 採購系統上下文入口

這個資料夾是新 thread、subagent、PM handoff 的最小上下文來源。目標是讓後續工作不用重讀長對話，也不要一開始就 bulk-read 舊文件。

## 讀取順序

1. 先讀工作區根目錄 `README.md`，確認目前專案入口。
2. 再讀本文件，確認角色、流程、模組文件索引。
3. 依任務只讀必要角色文件：
   - Requester: `roles/01-requester.zh-TW.md`
   - Dept DRI: `roles/02-dept-dri.zh-TW.md`
   - Cost Manager: `roles/03-cost-manager.zh-TW.md`
   - OM Leader: `roles/04-om-leader.zh-TW.md`
   - OM Purchasing: `roles/05-om-purchasing.zh-TW.md`
   - Budget Approver: `roles/06-budget-approver.zh-TW.md`
   - Admin: `roles/07-admin.zh-TW.md`
   - Buyer Handoff: `roles/08-buyer-handoff.zh-TW.md`
4. 若任務跨角色，再讀流程文件：
   - 主流程：`flows/pm-master-flow.zh-TW.md`
   - 例外與拒絕閉環：`flows/exception-flow.zh-TW.md`
   - Warehouse Inventory：`flows/warehouse-inventory-flow.zh-TW.md`
5. 若任務涉及表格、模組化、API，再讀：
   - `modules/table-role-module-map.zh-TW.md`
   - `modules/api-readiness.zh-TW.md`
6. 只有當上述文件不足，才讀 `procurement-prototype/PROJECT_DECISIONS.md` 查完整決策。

## 回覆與交接規則

- 預設使用繁體中文。
- 回覆要短而可執行，避免把舊上下文整段搬回主線。
- 長任務交接使用 compact handoff：
  - `Findings`
  - `Decision`
  - `Risk`
  - `Next`
- subagent 只能做有限任務：研究、規格、實作切片、測試、驗證；不能自行改產品決策。

## 不要預設讀取

- 不要一開始 bulk-read `docs-archive/`。
- 不要一開始讀舊 handoff package。
- 不要一開始逐份讀 `_doc/v*.md`。
- 不要把 `docs-current/it-handoff/` 當日常開發入口；只有 IT handoff 任務才讀。

## 正式角色名稱

本專案目前使用以下正式名稱：

- `Requester`
- `Dept DRI`
- `Cost Manager`
- `OM Leader`
- `OM Purchasing`
- `Budget Approver`
- `Admin`
- `Buyer Handoff`

舊稱只允許在 migration 或 legacy 文件中出現，不應作為新 UI、文件、測試的主稱呼。

## 核心原則

- 先定角色權責，再改 UI。
- Warehouse 是 evidence；只有經 workflow ledger/lock 的結果才影響成本。
- Cost Manager 的 `Demand Analysis > Cost Dashboard / Station Matrix` 是受保護 baseline，非必要不要改。
- Requester 畫面不得顯示 vendor、PAS material、factory material、OM assignee、FTV 等內部採購欄位。
- OM Leader 負責追蹤、派工、匯率、feedback triage；OM Purchasing 處理 assigned rows。
- Buyer Handoff 是 OM export 後的 PR/PO 所屬階段，不再使用容易誤解的 `Downstream` 作為使用者文案。
