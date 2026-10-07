# FIH 採購系統 Flow & UI UAT（前端靜態版）

這是供使用者確認流程與畫面的前端 UAT，內含 1,248 筆虛構工廠資料。資料只保存在目前瀏覽器的 `localStorage`，沒有後端、API、郵件或正式 ERP/PAS/Buyer 介接。

## 開啟方式

1. 解壓縮 ZIP，請勿直接在壓縮檔內執行。
2. 雙擊 `OPEN-DEMO.cmd`，或用 Chrome／Edge 開啟 `index.html`。
3. 在 Login 頁選擇角色，測試密碼固定為 `123`。
4. 登入後角色固定；要測試下一角色，請按 `Logout` 回到 Login 再登入。

## 角色切換與資料傳遞

- 工作區內沒有 Role 切換器，左側功能完全依登入角色呈現。
- `Logout` 只清除登入 session，不會刪除採購資料。
- Requester 送出的資料，Logout 後改以 Dept DRI 登入，會在 DRI queue 看到同一筆資料；後續角色亦同。
- Login 角色會自動帶入 DEMO 帳號；OM Purchasing 可選 Giang 或 Linh。

## 大量資料操作

- 內建 1,248 筆 deterministic DEMO rows。
- 支援 Project、Line、Mode、Search、50-row pagination 與表格橫向捲動。
- Requester 以 `Project + Line + MFG/Non-MFG` scope 批次送出有效需求。
- 有數量但缺少 Required Delivery Date 的資料會留在 Draft，不會混入送出批次。

## 注意事項

- 所有資料均標示為 DEMO/UAT，不可視為正式採購資料。
- 同一台電腦若換瀏覽器，資料不會自動共用。
- 清除瀏覽器網站資料會移除 UAT 進度。

