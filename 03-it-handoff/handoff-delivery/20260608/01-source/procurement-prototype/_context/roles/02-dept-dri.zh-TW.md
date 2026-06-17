# Dept DRI 角色上下文

## 商業定位

Dept DRI 是第一層業務確認者，負責自己 scope 內的 requester submission、warehouse / carryover candidate，以及 quote 後 price exception 的第一層確認。

## 可看資訊

- 自己負責 project / department / requester mapping 的 submissions。
- item/spec、need date、demand scope、qty、warehouse/carryover evidence、exception reason。
- price exception 摘要：history price、quote price、USD delta、threshold、Temporary Budget 標記。
- Cost Manager 與 Budget Approver 所需的下一站狀態。

## 可操作功能

- Approve / Reject requester submission。
- Approve / Reject warehouse inventory use candidate。
- Approve / Reject carryover candidate。
- Approve / Reject price exception 第一層。
- Reject 時填原因，回 Requester Action Required。

## 不可看 / 不可做

- 不手動輸入 carryover workbench。
- 不操作 OM quote、PAS Demand No、Export Package。
- 不做全域成本管理。
- 不替 Cost Manager 或 Budget Approver 做最終批准。

## 主要 UI / 模組

- Submission Review
- Stock / Carryover Review
- Price Exception Review
- Workflow Status Table

## 資料輸入 / 輸出

- 輸入：approve/reject decision、reason。
- 輸出：
  - requester submission approved -> Cost Manager final authorization。
  - requester submission rejected -> Requester Action Required。
  - stock/carryover approved -> locked/applied ledger。
  - price exception approved -> Budget Approver。

## 常見風險

- Dept DRI 不是 Cost Manager，也不是 OM operator；頁面不能塞 OM 操作。
- Dept DRI 只看自己 scope；如果 mapping 找不到，應標示 setup missing，不可猜。
- Temporary Budget 不是在 requester submit 後直接進 Budget Approver；quote 後仍需 Dept DRI review。

## 測試 / QA 重點

- Dept DRI approve submission 後必須進 Cost Manager，不可直接進 OM。
- Dept DRI reject 一律回 Requester Action Required。
- Dept DRI 不顯示手動 carryover input 或 top-level Suggest / Apply workbench。
- Dept DRI 只看到自己 scope 的 row。

## Compact Handoff

Dept DRI is the scoped first review gate. It approves/rejects requester submissions, stock/carryover candidates, and price exceptions, but does not operate OM workflows or global cost dashboards.
