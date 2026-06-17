# OM Purchasing 角色上下文

## 商業定位

OM Purchasing 是 OM 實際作業者。第一版為 Giang / Linh，只操作派給自己的 rows，完成 PAS Demand No、PAS Quote Result、Quote Expiry tracking 與 Export Package。

## 可看資訊

- assigned OM rows。
- PAS Demand No、PAS material、quote result、quote screenshot、quote Excel、quote valid until。
- assigned row 的 requester scope、need date、status、risk。
- Export Package 所需 metadata。

## 可操作功能

- 輸入 PAS Demand No。
- 輸入 PAS Quote Result：
  - PAS Material No
  - Vendor name
  - Vendor number
  - Unit price，支援 USD / VND input toggle
  - Quote screenshot image
  - Quote Excel
  - Quote Valid Until
- 追蹤 Quote Expiry。
- 準備 / Export Package。
- Reject to Requester / Dept DRI 路由，需保留原因。

## 不可看 / 不可做

- 不操作未指派 rows。
- 不派工。
- 不維護匯率。
- 不做 Dept DRI / Cost Manager / Budget Approver approval。
- 不改 requester demand scope。

## 主要 UI / 模組

- PAS Demand No
- PAS Quote Result
- Quote Expiry
- Export Package
- Assigned Work Table

## 資料輸入 / 輸出

- 輸入：PAS demand/material、vendor、quote screenshot、quote Excel、quote price、valid until、export package。
- 輸出：quote status、price decision、export metadata、audit events。

## 常見風險

- Quote 不是 PDF upload；第一版 quote evidence 是 screenshot/image，加上 quote Excel。
- Vendor part no 應使用 Vendor number；Vendor 應使用 Vendor name。
- Quote date 與 quote received date 視為同一天，不要重複增加欄位。
- Quote expiry warning threshold 是 10 天。

## 測試 / QA 重點

- Giang / Linh 只能操作 assigned rows。
- PAS Quote Result 必須有 screenshot/image 與 Excel。
- USD / VND input toggle 不可 double conversion。
- `quote - history > 0.40 USD`、no history、Temporary Budget 必須進 Dept DRI -> Budget Approver。

## Compact Handoff

OM Purchasing handles assigned OM rows only: PAS Demand No, quote result with screenshot + Excel, quote validity, and export package. It cannot assign, approve business decisions, or maintain exchange rates.
