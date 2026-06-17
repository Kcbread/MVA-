# Admin 角色上下文

## 商業定位

Admin 是系統設定與治理角色。它管理 users、roles、mapping、threshold、approval chain、OM members、audit 與 feedback setup，但不做 business approval。

## 可看資訊

- 使用者基本資料與角色。
- Requester mapping：Project Family + Project Code + Demand Department。
- Dept DRI scope。
- Approval chain。
- price threshold，例如 History Price Delta Threshold = 0.40 USD。
- OM Leader / OM Purchasing 成員與 assignment 設定。
- audit events、feedback review setup。

## 可操作功能

- 建立/更新使用者、角色、部門、email、employee id。
- 設定 requester mapping 與 Dept DRI scope。
- 設定 price threshold / approval chain。
- 設定 OM assignment rule。
- 查看 audit / feedback。

## 不可看 / 不可做

- 不 approve/reject business row。
- 不代替 Dept DRI、Cost Manager、Budget Approver。
- 不操作 OM quote/export。
- 不改需求 qty 作為 business decision。

## 主要 UI / 模組

- Access & Approval Setup
- User / Role Table
- Requester Mapping Table
- Threshold Setup
- OM Member Setup
- Audit / Feedback Admin

## 資料輸入 / 輸出

- 輸入：users、roles、mapping、rules、thresholds。
- 輸出：role guard、visibility flags、assignment rules、audit config。

## 常見風險

- Admin debug/impersonation 若保留，必須 audit。
- Admin setup 不等於 business approval override。
- 未 mapping 的 project/department 應顯示 `Need setup`，不可由系統亂猜 requester 或 approver。

## 測試 / QA 重點

- Admin 沒有 business approval action。
- Admin 可管理 role/mapping/rule。
- role dropdown 不能取代 server session role。
- audit 必須記錄敏感設定改動。

## Compact Handoff

Admin owns setup and governance only: users, roles, mappings, thresholds, approval chains, OM setup, audit/feedback. It must not silently perform business approvals.
