# Budget Approver 角色上下文

## 商業定位

Budget Approver 是 quote 後價格/預算例外的最終核准者。它只處理超過門檻、無 history price、Temporary Budget 等需要最終預算判斷的案例。

## 可看資訊

- Dept DRI 已 approve 的 price exception。
- Temporary Budget quote result。
- history price、quote price、USD delta、threshold、estimated vs quote、reason。
- item/spec、requester、project/stage/unit scope、need date。

## 可操作功能

- Final budget approve。
- Reject 回 Requester Action Required 或指定上一站修正。
- 填 rejection reason。

## 不可看 / 不可做

- 不建立需求。
- 不處理一般 requester submission approval。
- 不操作 OM quote/export。
- 不派工或維護匯率。
- 不改 warehouse/carryover evidence。

## 主要 UI / 模組

- Budget Exception Queue
- Review History
- Workflow Status Detail

## 資料輸入 / 輸出

- 輸入：approve/reject decision、reason。
- 輸出：
  - approved -> OM Export Package。
  - rejected -> Requester Action Required，保留 audit/timeline。

## 常見風險

- Temporary Budget 的最終 approve 發生在 OM quote result 後，不是 requester submit 當下。
- Budget Approver 不替 Cost Manager 做一般 final authorization。
- 若 threshold 或 approval chain 未設定，應提示 Admin setup，不可預設通過。

## 測試 / QA 重點

- Temporary Budget quote 後必須先經 Dept DRI，再到 Budget Approver。
- Budget Approver approve 後才進 OM Export。
- Budget Approver reject 回 Requester 修正。

## Compact Handoff

Budget Approver is the final gate for price and budget exceptions after Dept DRI review. It does not handle normal submission approvals or OM operations.
