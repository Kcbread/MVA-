# Dept DRI 角色上下文

## 商業定位

Dept DRI 是第一層業務確認者，負責自己 scope 內的 requester submission、Unit-owned warehouse / carryover candidate，以及 quote 後 price exception 的第一層確認。OM-owned 與 MFG-owned warehouse candidate 必須回到對應 item/warehouse owner，不由 Dept DRI 代決。

## 可看資訊

- 自己負責 project / department / requester mapping 的 submissions。
- item/spec、need date、demand scope、qty、warehouse/carryover evidence、exception reason。
- price exception 摘要：history price、quote price、USD delta、threshold、Temporary Budget 標記。
- Cost Manager 與 Budget Approver 所需的下一站狀態。
- 使用 dashboard-first `Project Review`：Dashboard 顯示 active project 全品項 MFG aggregate 與 Non-MFG department totals；queue row / item click 只切換 active item 並回 Dashboard overview；MFG Station Detail / Non-MFG Department Detail 才展開 selected item 明細。
- Project Review 顯示自己 scope 內 pending、approved、in-pipeline rows；審批動作只在 Review Queue。

## 可操作功能

- Approve / Reject requester submission。
- Approve / Reject 自己 unit scope 內的 warehouse inventory use candidate。
- Approve / Reject carryover candidate。
- Approve / Reject price exception 第一層。
- 在 Item Quantity Review popup 直接 add/edit/delete 正式需求數量；每次 direct edit 必須寫 audit / revision metadata。
- Reject 時填原因，回 Requester Action Required。

## 不可看 / 不可做

- 不手動輸入 carryover workbench。
- 不代替 OM / MFG warehouse owner lock/reject 其自有庫存。
- 不操作 OM quote、PAS Demand No、Export Package。
- 不做全域成本管理。
- 不替 Cost Manager 或 Budget Approver 做最終批准。

## 主要 UI / 模組

- Review Queue
  - Submission Review
  - Stock / Carryover Review
  - Price Exception Review
- Project Review
  - Dashboard
  - MFG Station Detail
  - Non-MFG Department Detail
  - Item Quantity Review direct edit popup
- Review History

## 資料輸入 / 輸出

- 輸入：approve/reject decision、reason、direct quantity edit note。
- 輸出：
  - requester submission approved -> Cost Manager final authorization。
  - requester submission rejected -> Requester Action Required。
  - direct quantity edit -> 更新正式 stationBreakdown / phase qty / total qty，並保留 itemQuantityReviewHistory audit。
- unit-owned stock/carryover approved -> locked/applied ledger。
  - price exception approved -> Budget Approver。

## 常見風險

- Dept DRI 不是 Cost Manager，也不是 OM operator；頁面不能塞 OM 操作。
- Dept DRI 只看自己 scope；如果 mapping 找不到，應標示 setup missing，不可猜。
- Warehouse candidate 必須看 item owner：OM-owned 交 OM，MFG-owned 交 MFG owner，Unit-owned 才是 Dept DRI / Unit owner lock。
- Temporary Budget 不是在 requester submit 後直接進 Budget Approver；quote 後仍需 Dept DRI review。

## 測試 / QA 重點

- Dept DRI approve submission 後必須進 Cost Manager，不可直接進 OM。
- Dept DRI reject 一律回 Requester Action Required。
- Dept DRI 不顯示手動 carryover input 或 top-level Suggest / Apply workbench。
- Dept DRI 不顯示獨立全域 `Cost Dashboard` / `Station Matrix` tab；review 內固定使用 `Dashboard / MFG Station Detail / Non-MFG Department Detail`。
- Item Quantity Review popup 點 quantity / total / item cell 都可開啟，direct edit 後必須同步 total qty 並增加 audit count。
- Dept DRI 主畫面不顯示大型 carryover card、line impact strip 或空 ledger。
- Dept DRI 不 lock OM-owned / MFG-owned warehouse candidate。
- Dept DRI 只看到自己 scope 的 row。

## Compact Handoff

Dept DRI is the scoped first review gate. It approves/rejects requester submissions, unit-owned stock/carryover candidates, and price exceptions in Review Queue, with dashboard-first Project Review for role-visible rows, Dashboard, MFG Station Detail / Non-MFG Department Detail drill-in, and audited direct quantity edits.
