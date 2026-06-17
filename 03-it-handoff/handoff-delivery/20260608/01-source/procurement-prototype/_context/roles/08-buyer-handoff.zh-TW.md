# Buyer Handoff 角色上下文

## 商業定位

Buyer Handoff 是 OM Export Package 完成後，交給 Buyer/PUR 處理 PR / PO / arrival 的階段。這不是目前 prototype 的主要操作角色，而是狀態交接與後續責任標示。

## 可看資訊

- 已 export 的 package。
- Cost type：Expense / Capex。
- 對應 package：ECS / CFA。
- quote screenshot / quote Excel metadata。
- PAS context 與 export metadata。
- Buyer owns PR / PO after OM export 的狀態提示。

## 可操作功能

- 第一版 prototype 主要為狀態顯示，不做完整 Buyer 操作。
- 未來可擴充 PR / PO / arrival 回填。

## 不可看 / 不可做

- 不參與 requester submission approval。
- 不參與 Dept DRI / Cost Manager / Budget Approver 判斷。
- 不改 OM quote result。
- 不決定 warehouse/carryover。

## 主要 UI / 模組

- Buyer Handoff status chip
- Export Package detail
- Future PR / PO feedback table

## 資料輸入 / 輸出

- 輸入：未來可能有 PR/PO/arrival 回填。
- 輸出：Buyer stage status、days in Buyer stage、handoff timestamp。

## 常見風險

- 使用者介面不要再用 `Downstream` 當主稱呼，容易誤會責任不明。
- OM Submission Dashboard 不應塞滿 PR/PO/Arrived 百分比；只需標示 Buyer owns PR/PO after OM export 與天數。

## 測試 / QA 重點

- OM export 後狀態顯示 Buyer Handoff。
- UI 不出現 user-facing `Downstream`。
- Buyer stage days 計算清楚，避免與 OM days pending 混淆。

## Compact Handoff

Buyer Handoff marks the post-OM-export PR/PO ownership stage. It replaces vague downstream wording and should be shown as handoff status, not mixed into OM operational work.
