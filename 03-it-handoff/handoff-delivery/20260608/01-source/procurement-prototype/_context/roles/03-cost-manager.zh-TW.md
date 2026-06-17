# Cost Manager 角色上下文

## 商業定位

Cost Manager 是高階成本與 P&L owner。它看全域成本、phase/unit spend、carryover savings、effective cost 與 station drilldown，並在 Dept DRI approve 後做 final authorization。

## 可看資訊

- Cost Dashboard：project / stage / unit / department 的成本與數量。
- Station Matrix：Excel-like station-level demand detail。
- Carryover / Warehouse locked impact：original、saving、effective。
- Submission Monitor：pending owner、current stage、days pending、quote status、next action、risk。
- price exception 與 Temporary Budget 的成本影響摘要。

## 可操作功能

- Final authorization / reject Dept DRI approved requester submission。
- 查看 Cost Dashboard / Station Matrix / Submission Monitor。
- 查看 carryover ledger 與 effective cost impact。

## 不可看 / 不可做

- 不建立 requester demand。
- 不操作 warehouse lock。
- 不操作 OM quote、PAS Demand No、Export Package。
- 不派工 OM。
- 不改 supplier/vendor/FTV/Buyer PR/PO 作業資料。

## 主要 UI / 模組

- Demand Analysis
  - Cost Dashboard
  - Station Matrix
- Submission Monitor
- Final Authorization Queue
- Carryover Ledger / Cost Compare

## 資料輸入 / 輸出

- 輸入：final authorization decision、reject reason。
- 輸出：
  - approved -> OM Leader intake / assignment。
  - rejected -> Requester Action Required。
  - Cost Dashboard / Station Matrix 只輸出 view state，不改需求資料。

## 常見風險

- `Demand Analysis > Cost Dashboard / Station Matrix` 是 protected baseline；狀態表或 UI refactor 不可污染。
- Cost Manager 看到的是成本決策資訊，不是 OM operation form。
- Carryover pending 與 applied 必須分清楚：只有 locked/applied 才是正式 cost impact。

## 測試 / QA 重點

- Cost Dashboard / Station Matrix render 不因 workflow refactor 改變。
- Cost Manager 沒有 Requester / OM / warehouse 操作權。
- Dept DRI approve 後才出現在 Cost Manager final authorization。
- Cost Manager approve 後才進 OM Leader intake。

## Compact Handoff

Cost Manager owns P&L-level visibility and final authorization. Its Demand Analysis is a protected baseline; it can approve/reject after Dept DRI but cannot edit demand, lock warehouse, or operate OM rows.
