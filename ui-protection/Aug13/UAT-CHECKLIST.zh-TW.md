# FIH Factory Flow & UI UAT Checklist

測試人：__________　日期：__________　瀏覽器／版本：__________

## Login 與跨角色流程

- [ ] 開啟後先看到 Login，不會直接進入工作區。
- [ ] Login 可選八種角色，密碼 `123` 可登入。
- [ ] 登入後工作區沒有 Role selector。
- [ ] 左側只出現目前登入角色的功能。
- [ ] Logout 回到 Login，採購資料與操作進度仍保留。
- [ ] Requester 送出後，以 Dept DRI 登入可找到同一個 Demand ID。

## 大量資料與共同操作

- [ ] 顯示至少 1,248 筆 DEMO rows，並註明 Frontend only／No backend。
- [ ] Project、Line、Mode、Search 與 50-row pagination 可操作。
- [ ] 密集表格可橫向捲動，固定欄位不遮住主要內容。

## Requester

- [ ] Add Item、Purpose、Required Delivery Date、各 Phase Qty 可輸入。
- [ ] Save Draft 與 Validate & Submit Scope 可操作。
- [ ] 有數量但缺 Required Delivery Date 的 row 留在 Draft。
- [ ] Action Required 可填 Revision Note 並 Resubmit。

## Review／OM／Buyer／Admin

- [ ] Dept DRI：Approve／Reject，Reject 必須填 reason。
- [ ] Cost Manager：Authorize／Reject。
- [ ] Budget Approver：Final Approve／Reject。
- [ ] OM Leader：Assignment、Progress Review、Project Stage Calendar。
- [ ] OM Purchasing：My Intake、My Quote Result、Quotation DB、OM Handoff。
- [ ] Buyer Handoff：只讀接收與歷史查詢。
- [ ] Admin：設定與稽核功能，不可代替業務角色核准。

| Role | Demand ID | Step | Expected | Actual | Flow issue | UI suggestion |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |

