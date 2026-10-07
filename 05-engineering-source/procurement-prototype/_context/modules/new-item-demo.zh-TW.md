# Add Item demo — 2026-09-07 使用者確認

## 最新補齊：未完成新品草稿也可恢復

- 未完成新品表單按帳號與專案／工作表 context 自動寫入本機瀏覽器，包含輸入與所在步驟；重新整理後重開新品入口可接續。
- Discard draft、Use this item、成功加入需求後移除對應新品表單快照，避免復活；Close／Esc 保留。
- 本節取代下方歷史紀錄中「未完成表單只在 session 保留」的限制。跨裝置／後端同步仍不在範圍。
- 完整測試紀錄：`../../_doc/qa-new-item-20260907.md`。

## 使用者核准：草稿與建議修正

- Save Draft 寫入此瀏覽器 localStorage（版本 1），以 Requester employeeId/email 分開儲存。重新載入時恢復已儲存需求的 Spec、單位、用途、phase 數量及狀態。
- 送出會用新需求編號替換已儲存草稿；移除草稿同步移除本機記錄，避免重新整理後復活。儲存失敗顯示錯誤。
- 尚未加入需求的新品表單草稿在本頁 session 保留：返回、Close、Esc 不刪除；明確 Discard draft 才刪除。此未完成表單不宣稱可跨重新整理恢復。
- 返回分為 Back to results / Back to catalog。返回 catalog 帶回目前搜尋字；重開同帳號、專案、工作表／line 的新品入口可接續原草稿。關閉後焦點回到可見入口。
- 相同品名＋Spec 在建議區合併，各来源保留於 Details；不同規格分列，不改動原始資料。候選比對／合併在結果截取前處理。
- 僅本機 demo 儲存，非後端同步；跨裝置與後續其他角色的狀態持久化不在此範圍。
- 驗證：new-item-demo-smoke.js 與 requester-draft-state-smoke.js（可設定 DEMO_BROWSER_CHANNEL=msedge）。

## 搜尋建議呈現

- 每筆建議第一列為粗體品名，第二列為明確標示 Spec 的規格；分類／來源收於 Details。
- 命中文字不分大小寫加亮；HTML 特殊符號安全跳脫，搜尋中的正規表達式符號視為字面文字。
- 品名完全吻合優先，其次所有關鍵字命中品名、部分命中品名、僅規格命中；排序在截取結果前執行。
- Use this item 行為維持既有來源加入需求；主需求工作表不變。

## 最新確認：分步搜尋與建立新品

- 第一步 `Find or add an item`：只顯示品名輸入、Matching items、Use this item，以及 Create a new item 入口；Lv123、Spec、單位、用途與送出按鈕隱藏。
- 第二步 `Create a new item`：帶入品名，顯示新品欄位；Back to search 返回第一步並保留草稿。Add to request 建立待審需求，提示 New items require review。
- 輸入品名只更新匹配區，不重排 DOM 或重設輸入值，避免丟失鍵盤焦點與游標。Enter 在搜尋步驟不得建立需求。
- 內部狀態仍保留 Pending Material Review，操作畫面使用一般業務文字。

## 同日修正（使用者最新指示）

- 操作文字全部使用英文；資料品名維持來源語言。
- 新品表單 Lv1/Lv2/Lv3 一律初始空白，不繼承搜尋分類；搜尋及選取既有建議不要求分類。
- 品名輸入在最前方，隨輸入提供跨分類相似建議。每筆建議顯示 Item、Spec 及 `Use this item` 按鈕。
- `Use this item` 直接以來源品项建立零數量需求並移除未完成新品草稿，不要求先填新品欄位或差異原因。

- 保持 Excel-like 工作表、數量計算與角色責任。
- 搜尋支援品名、多語品名與 Spec 的部分文字；多個空白分隔關鍵字需全部命中。
- 搜尋结果固定以 Item / Detail / Spec 分欄；Spec 優先取 spec，不能用 detail 覆蓋。
- 既有品項「加入需求」；找不到時以獨立按鈕或 New Item Request 頁籤開啟新品表單。
- 新品必填品名、Lv1–3、单一 Spec 規格描述、單位下拉與用途。
- Spec 只填一次；不要求 Requester 填 Structured Spec、Spec Summary、多語翻譯或估價。
- 有相似品時必填差異；參考連結選填。返回搜尋可選既有品。
- 新品以 Draft demand + Pending Material Review 加入當前工作表，phase 數量從 0 開始，保留 Spec、單位、差異及參考資料。
- 此次僅 demo 前端資料流，不新增後端 API／審核持久化。重新載入的保存能力沿用既有系統，不能宣稱正式物品主檔已建立。
- 本決策優先於舊角色文件要求 CN/EN/VN、估價與結構化規格皆必填的新品規則；legacy standardization 維持舊規則。

驗證：`DEMO_BROWSER_CHANNEL=msedge node tests/new-item-demo-smoke.js`（Windows 可先設定環境變數）。
