# OM Leader 角色上下文

## 商業定位

OM Leader 是 OM 作業主管。第一版指定 Mai，負責 OM 進度追蹤、派工、匯率 override / backup、UAT OM orchestration，以及必要時查看全部 OM rows。

## 可看資訊

- 所有 OM rows 與 assignment。
- Submission Dashboard / Quotation DB / OM Handoff 的高階進度。
- monthly locked exchange rate 狀態。
- Giang / Linh 的 assigned workload。

## 可操作功能

- Assign / reassign / clear OM row assignee。
- 維護 Project Stage Calendar：以 `Year Project + Project + Phase` 定義 line open date，供 Requester phase input、Dept DRI review、OM tracking 共用。
- Override / backup 維護 monthly locked USD/VND exchange rate；日常輸入 owner 是 Giang。
- 查看全部 OM 進度與 risk。

## 不可看 / 不可做

- 不作為 requester / Dept DRI / Cost Manager / Budget Approver 的 business approval。
- 預設不操作報價 row；報價輸入由 OM Purchasing 處理。若未來要讓 Mai 代操作，必須另定規則並 audit。
- 不改 requester demand。

## 主要 UI / 模組

- OM Submission Dashboard
- Assignment Control
- Exchange Rate Utility
- Quotation DB

## 資料輸入 / 輸出

- 輸入：assignment、Project Stage Calendar phase line open date、exchange rate override、OM orchestration status。
- 輸出：OM assignee、phase-level line open date metadata、audit events、monthly locked exchange rate。

## 常見風險

- CPD-IEP Owner 是業務 owner，不等於 OM assignee。
- Mai 能看全部 OM rows，但不代表可以替其他角色 approve。
- 派工規則目前：Linh 負責 P27 / F27，其他預設 Giang；系統可自動分配，Mai 可調整。

## 測試 / QA 重點

- Mai 可 assign / reassign / clear。
- Giang / Linh 不可派工。
- Monthly exchange rate 由 Giang 輸入並全局套用；Mai / Admin 可 override，Linh 預設不可維護。
- Mai 看到全部 OM rows；OM Purchasing 只看 assigned rows。
- Project Stage Calendar 的 line open date 必須被 Requester phase input 帶入，但 Requester 不可直接改 line open date。

## Compact Handoff

OM Leader is Mai: assignment, Project Stage Calendar phase dates, exchange rate, tracking, OM orchestration, and Quotation DB visibility. It sees all OM work but should not become a hidden business approver or default quote operator.
