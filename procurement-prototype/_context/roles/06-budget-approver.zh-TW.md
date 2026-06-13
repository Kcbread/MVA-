# Budget Approver 角色上下文

## 商業定位

Budget Approver 是 quote 後價格/預算例外的最終核准者。它只處理超過門檻、無 history price、Temporary Budget 等需要最終預算判斷的案例。

## 可看資訊

- Dept DRI 已 approve 的 price exception。
- Temporary Budget quote result。
- history price、quote price、USD delta、threshold、estimated vs quote、reason。
- item/spec、requester、project/stage/unit scope、need date。
- 使用與 Cost Manager 同殼的 `Budget Review`：上方是 Budget Exception queue / Final Approve-Reject action，下方是同一套 dashboard-first evidence。
- `Budget Review` 主表與 Dashboard / MFG Station Detail / Non-MFG Department Detail 的第一欄固定為 `Review Status`，只顯示審批鏈狀態，不取代或混用 project status。
- Dashboard 是不需 selected row 的 MFG aggregate + Non-MFG department 全域總覽；MFG Station Detail / Non-MFG Department Detail 才使用 selected row 或 dashboard cell drill-in scope。
- 已 final approve / reject / in-pipeline 的 budget exception rows 仍留在主 evidence，可 drilldown，但以 `Final approved` / `Rejected by Budget Approver` / current owner 標示並改為 read-only。`Review History` 保留 audit log，不作為找 approved item 的主要入口。

## 可操作功能

- Final budget approve。
- Reject 回 Requester Action Required 或指定上一站修正。
- 在 Item Quantity Review popup 直接 add/edit/delete 正式需求數量；每次 direct edit 必須寫 audit / revision metadata。
- 填 rejection reason。

## 不可看 / 不可做

- 不建立需求。
- 不處理一般 requester submission approval。
- 不操作 OM quote/export。
- 不派工或維護匯率。
- 不改 warehouse/carryover evidence。
- 不提供獨立 `Cost Dashboard` / `Station Matrix` analysis tab。
- 不把 carryover 作為主視覺或第一眼決策資訊。

## 主要 UI / 模組

- Budget Review
  - Budget Exception Approval
  - Dashboard
  - MFG Station Detail
  - Non-MFG Department Detail
  - Item Quantity Review direct edit popup
- Review History

## 資料輸入 / 輸出

- 輸入：approve/reject decision、reason、direct quantity edit note。
- 輸出：
  - approved -> OM Export Package。
  - rejected -> Requester Action Required，保留 audit/timeline。
  - direct quantity edit -> 更新正式 stationBreakdown / phase qty / total qty，並保留 itemQuantityReviewHistory audit。

## 常見風險

- Temporary Budget 的最終 approve 發生在 OM quote result 後，不是 requester submit 當下。
- Budget Approver 不替 Cost Manager 做一般 final authorization。
- 若 threshold 或 approval chain 未設定，應提示 Admin setup，不可預設通過。

## 測試 / QA 重點

- Temporary Budget quote 後必須先經 Dept DRI，再到 Budget Approver。
- Budget Approver approve 後才進 OM Export。
- Budget Approver reject 回 Requester 修正。
- Budget Approver 只看到 `Budget Review / Review History`，不再提供獨立 top-level `Project Review`。
- Budget Review 內的 Dashboard 預設全域；MFG Station Detail / Non-MFG Department Detail scope 必須跟 selected row 或 dashboard cell drill-in 同步。
- Budget Approver final approve 後該 row 必須仍在 `Budget Review` evidence 可見，第一欄顯示 `Final approved` 與目前派往 OM Export。
- Item Quantity Review popup 點 quantity / total / item cell 都可開啟，direct edit 後必須同步 total qty 並增加 audit count。

## Compact Handoff

Budget Approver is the final gate for price and budget exceptions after Dept DRI review. It uses the same Cost Manager-style review shell with Dashboard-first aggregate, MFG Station Detail / Non-MFG Department Detail drill-in, and audited direct quantity edits, but only for budget exception approval decisions.
