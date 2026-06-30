# OM Purchasing 角色上下文

## 商業定位

OM Purchasing 是 OM 實際作業者。第一版為 Giang / Linh，只操作派給自己的 rows，完成 PAS Demand No、My Quote Result、OM Handoff，以及 OM-side budget / PR / PO / arrival tracking。Giang 另負責每月 USD/VND locked rate 輸入。

## 可看資訊

- assigned OM rows。
- PAS Demand No、PAS material、quote result、quote screenshot、quote Excel、quote valid until。
- assigned row 的 requester scope、need date、status、risk。
- Requester input 的 Purpose（SMT / FATP）唯讀顯示，用於 OM tracking；OM 不改 Purpose。
- Date planning：Date of request、Required Delivery Date、Line open date、Required Delivery Date follow Stage date、Given LT。
- OM Handoff 所需 metadata。
- Monthly locked USD/VND rate 狀態。

## 可操作功能

- 輸入 PAS Demand No。
- 在 My Intake 查看 Quotation DB 候選報價；經 Central IT 確認後，可套用候選報價帶入 PAS Demand No、PAS Material No、vendor、price、quote date、quote valid until，並進入 My Quote Result 後續處理。
- 輸入並確認 My Quote Result；Validate Quote 會依 OM 輸入資料生成 system PAS Tracking Excel，並自動附在系統 OM-internal attachments，供下一次取用：
  - PAS Material No
  - Vendor name
  - Vendor number
  - Unit price，支援 USD / VND input toggle
  - Quote screenshot image
  - Quote Valid Until
  - System PAS Tracking Excel（由 Validate Quote 或 Generate Excel 依輸入資料生成，不由 OM 上傳）
- Validate Quote 會同步執行 price decision 與 Quotation DB retention 判斷：
  - 完整且有效期大於 7 天：標記 `Ready for Quotation DB`，作為後續 DB/API sync 候選。
  - 7 天內到期：標記 `Review before Quotation DB`，需確認 reuse window。
  - 已過期或欄位不完整：不可留存為可 reuse 候選。
- 追蹤 Quote validity / blocker / stage aging。
- 準備 / OM Handoff。
- 在 My Exports / OM tracking 回填 Budget status、Budget #、PR status、PR#、PO status、PO#、ETA (PLAN)、DTA (Actual)、Total lead time。
- 輸入或接受系統建議的 `#PUR request NO`；建議格式由 `Each dept + project + quantity + item name + spec` 組成，OM 可覆寫。
- Reject to Requester / Dept DRI 路由，需保留原因。
- Giang 可輸入 monthly locked USD/VND exchange rate，該 rate 全局套用；Mai / Admin 可 override。

## 不可看 / 不可做

- 不操作未指派 rows。
- 不派工。
- Linh 與一般 OM Purchasing 不維護匯率；只有 Giang 有 monthly exchange-rate input 權責。
- 不做 Dept DRI / Cost Manager / Budget Approver approval。
- 不改 requester demand scope。
- 不改 Requester Purpose、Project Stage Calendar line open date、Date of request；Purpose 僅作 OM tracking only。

## 主要 UI / 模組

- PAS Demand No
- My Quote Result
- Quotation DB
- OM Handoff
- My Exports OM tracking（Budget / PR / PO / ETA / DTA / PUR request / Total LT）
- Assigned Work Table

## 資料輸入 / 輸出

- 輸入：PAS demand/material、vendor、quote screenshot、quote price、valid until、OM handoff scope、Budget status、Budget #、PR status/#、PO status/#、ETA (PLAN)、DTA (Actual)、#PUR request NO、Total lead time；Giang 另輸入 monthly USD/VND rate。
- 輸出：quote status、price decision、handoff metadata、OM procurement tracking metadata、audit events。

## 常見風險

- Quote 不是 PDF upload；第一版 quote evidence 是 screenshot/image，加上系統依 My Quote Result 生成的 PAS Tracking Excel。
- `system PAS Tracking Excel` 是 Validate Quote / Generate Excel 後由系統依 My Quote Result 生成並附在系統的工作簿，不是 OM 上傳欄位。API mode 會寫入 `/api/attachments`；local prototype mode 只記 metadata，不可說成 real upload。
- Vendor part no 應使用 Vendor number；Vendor 應使用 Vendor name。
- Quote date 與 quote received date 視為同一天，不要重複增加欄位。
- Quote expiry warning threshold 是 7 天；`Quotation DB` 整合可 reuse 報價紀錄與到期提醒。My Intake 可在 Central IT 確認後套用候選報價，但實際 quote result / valid until 的人工輸入與修正仍在 `My Quote Result`。目前 prototype 的 Validate Quote 只標記 retention decision，不代表已 real execution 寫入 MySQL `pas_quotes`。
- Quote conversion 使用 quote date 所在月份 rate；若該月缺失，fallback 到最新的前一個 locked monthly rate。每月 28 日到下月 4 日提醒期間仍照此規則。
- 不要把 `SMT / FATP` 放進 Phase。Phase 是 `P1.0 / P1.1 / EVT / DVT / PVT / MP`；SMT/FATP 是 Requester Purpose，OM 只能追蹤。

## 測試 / QA 重點

- Giang / Linh 只能操作 assigned rows。
- Giang 可儲存 monthly exchange rate；Linh 預設不可。
- My Quote Result 必須有 screenshot/image；Excel 必須由系統依輸入資料生成並附在系統。
- USD / VND input toggle 不可 double conversion。
- `quote - history > 0.40 USD`、no history、Temporary Budget 必須進 Dept DRI -> Budget Approver。
- My Exports 必須能操作 Budget status/#、PR/PO status/#、ETA/DTA、#PUR request NO、Total LT；Purpose 必須唯讀。

## Compact Handoff

OM Purchasing handles assigned OM rows only: PAS Demand No, quote result with screenshot + system-generated Excel, quote validity, OM Handoff, and OM-side budget / PR / PO / arrival tracking. Giang also owns monthly USD/VND rate input; Linh cannot assign, approve business decisions, maintain exchange rates, or change requester-owned Purpose/date scope.
