# Buyer Handoff 角色上下文

## 商業定位

Buyer Handoff 是 OM Handoff 完成後的交接/狀態階段。IT item 的 PR / PO / arrival tracking 第一版整合在 OM Purchasing My Exports 操作；Buyer Handoff 保留為交接狀態、歷程與未來外部 Buyer/PUR 整合邊界。

## 可看資訊

- 已完成 OM Handoff 的 scope。
- Cost type：Expense / Capex。
- 對應 package：ECS / CFA。
- quote screenshot / quote Excel metadata。
- PAS context 與 handoff metadata。
- OM Purchasing 回填的 PR / PO / ETA / DTA / #PUR request / Total LT 摘要（read-only）。
- Buyer handoff 狀態提示與 handoff timestamp。

## 可操作功能

- 第一版 prototype 主要為狀態顯示，不做完整 Buyer 操作。
- 不直接回填 PR / PO / arrival；這些目前由 OM Purchasing 操作。

## 不可看 / 不可做

- 不參與 requester submission approval。
- 不參與 Dept DRI / Cost Manager / Budget Approver 判斷。
- 不改 OM quote result。
- 不改 OM Purchasing 的 PR / PO / arrival / Budget tracking 欄位。
- 不決定 warehouse/carryover。

## 主要 UI / 模組

- Buyer Handoff status chip
- OM Handoff detail
- Future external Buyer/PUR feedback table

## 資料輸入 / 輸出

- 輸入：第一版無主要 Buyer input；未來可能串接 external Buyer/PUR feedback。
- 輸出：Buyer handoff status、days in Buyer handoff、handoff timestamp、OM tracking summary。

## 常見風險

- 使用者介面不要再用 `Downstream` 當主稱呼，容易誤會責任不明。
- OM Submission Dashboard 不應塞滿 PR/PO/Arrived 百分比；PR/PO/ETA/DTA 操作集中在 OM Purchasing My Exports，Buyer Handoff 只顯示交接狀態與摘要。

## 測試 / QA 重點

- OM Handoff 後狀態顯示 Buyer Handoff。
- UI 不出現 user-facing `Downstream`。
- Buyer stage days 計算清楚，避免與 OM days pending 混淆。
- Buyer Handoff 不可出現可編輯 PR/PO/ETA/DTA input；可編輯欄位屬於 OM Purchasing。

## Compact Handoff

Buyer Handoff marks the post-OM-Handoff stage. In the first prototype, IT PR/PO/arrival tracking is operated in OM Purchasing My Exports, while Buyer Handoff remains a read-only status and future external Buyer/PUR integration boundary.
