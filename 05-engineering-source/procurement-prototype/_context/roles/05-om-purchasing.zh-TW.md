# OM Purchasing 角色上下文

## 商業定位

OM Purchasing 是 OM 實際作業者。第一版為 Giang / Linh，只操作派給自己的 rows，完成 PAS Demand No、Quote Result / Monitor 與 Export Package。Giang 另負責每月 USD/VND locked rate 輸入。

## 可看資訊

- assigned OM rows。
- PAS Demand No、PAS material、quote result、quote screenshot、quote Excel、quote valid until。
- assigned row 的 requester scope、need date、status、risk。
- Export Package 所需 metadata。
- Monthly locked USD/VND rate 狀態。

## 可操作功能

- 輸入 PAS Demand No。
- 輸入 Quote Result / Monitor：
  - PAS Material No
  - Vendor name
  - Vendor number
  - Unit price，支援 USD / VND input toggle
  - Quote screenshot image
  - Quote Excel
  - Quote Valid Until
- 追蹤 Quote validity / blocker / stage aging。
- 準備 / Export Package。
- Reject to Requester / Dept DRI 路由，需保留原因。
- Giang 可輸入 monthly locked USD/VND exchange rate，該 rate 全局套用；Mai / Admin 可 override。

## 不可看 / 不可做

- 不操作未指派 rows。
- 不派工。
- Linh 與一般 OM Purchasing 不維護匯率；只有 Giang 有 monthly exchange-rate input 權責。
- 不做 Dept DRI / Cost Manager / Budget Approver approval。
- 不改 requester demand scope。

## 主要 UI / 模組

- PAS Demand No
- Quote Result / Monitor
- Export Package
- Assigned Work Table

## 資料輸入 / 輸出

- 輸入：PAS demand/material、vendor、quote screenshot、quote Excel、quote price、valid until、export package；Giang 另輸入 monthly USD/VND rate。
- 輸出：quote status、price decision、export metadata、audit events。

## 常見風險

- Quote 不是 PDF upload；第一版 quote evidence 是 screenshot/image，加上 quote Excel。
- Vendor part no 應使用 Vendor number；Vendor 應使用 Vendor name。
- Quote date 與 quote received date 視為同一天，不要重複增加欄位。
- Quote expiry warning threshold 是 10 天。
- Quote conversion 使用 quote date 所在月份 rate；若該月缺失，fallback 到最新的前一個 locked monthly rate。每月 28 日到下月 4 日提醒期間仍照此規則。

## 測試 / QA 重點

- Giang / Linh 只能操作 assigned rows。
- Giang 可儲存 monthly exchange rate；Linh 預設不可。
- Quote Result / Monitor 必須有 screenshot/image 與 Excel。
- USD / VND input toggle 不可 double conversion。
- `quote - history > 0.40 USD`、no history、Temporary Budget 必須進 Dept DRI -> Budget Approver。

## Compact Handoff

OM Purchasing handles assigned OM rows only: PAS Demand No, quote result with screenshot + Excel, quote validity, and export package. Giang also owns monthly USD/VND rate input; Linh cannot assign, approve business decisions, or maintain exchange rates.
