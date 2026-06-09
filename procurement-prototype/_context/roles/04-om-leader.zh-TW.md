# OM Leader 角色上下文

## 商業定位

OM Leader 是 OM 作業主管。第一版指定 Mai，負責 OM 進度追蹤、派工、匯率維護、UAT feedback triage，以及必要時查看全部 OM rows。

## 可看資訊

- 所有 OM rows 與 assignment。
- Submission Dashboard / Quote Expiry / Export Package 的高階進度。
- exchange rate 狀態。
- UAT feedback review。
- Giang / Linh 的 assigned workload。

## 可操作功能

- Assign / reassign / clear OM row assignee。
- 維護 USD/VND exchange rate。
- 查看全部 OM 進度與 risk。
- Triage feedback，改 status/owner。

## 不可看 / 不可做

- 不作為 requester / Dept DRI / Cost Manager / Budget Approver 的 business approval。
- 預設不操作報價 row；報價輸入由 OM Purchasing 處理。若未來要讓 Mai 代操作，必須另定規則並 audit。
- 不改 requester demand。

## 主要 UI / 模組

- OM Submission Dashboard
- Assignment Control
- Exchange Rate Utility
- Quote Expiry Monitor
- UAT Feedback Review

## 資料輸入 / 輸出

- 輸入：assignment、exchange rate、feedback triage status。
- 輸出：OM assignee、audit events、active exchange rate、feedback owner/status。

## 常見風險

- CPD-IEP Owner 是業務 owner，不等於 OM assignee。
- Mai 能看全部 OM rows，但不代表可以替其他角色 approve。
- 派工規則目前：Linh 負責 P27 / F27，其他預設 Giang；系統可自動分配，Mai 可調整。

## 測試 / QA 重點

- Mai 可 assign / reassign / clear。
- Giang / Linh 不可派工。
- Exchange rate 只有 Mai / Admin 可改。
- Mai 看到全部 OM rows 與 feedback；OM Purchasing 只看 assigned rows。

## Compact Handoff

OM Leader is Mai: assignment, exchange rate, tracking, feedback triage. It sees all OM work but should not become a hidden business approver or default quote operator.
