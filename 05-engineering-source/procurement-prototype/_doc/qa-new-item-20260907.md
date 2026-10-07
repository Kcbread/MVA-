# 2026-09-07 Add Item 完整測試紀錄

## 本輪修改

- 未完成新品草稿自動本機保存／重新整理恢復，依 Requester 與專案／工作表 context 區隔。
- 明確丟棄、選用既有品項或成功建立需求後清除新品快照。
- 修正 Windows Excel 讀取執行環境：使用已有 openpyxl 的 bundled Python，子程序採 UTF-8。原始資料成功讀取 1,884 列；分類與 Catalog API 測試恢復通過。
- 測試支援 DEMO_BROWSER_CHANNEL，使用已安裝 Edge；未下載新瀏覽器。校正已確認的側欄／頁面標題測試位置。

## 實測結果

| 項目 | 結果 |
|---|---|
| test.sh syntax checks | PASS |
| Unit / System / API tests | PASS，151 / 151 |
| Basic browser smoke | PASS |
| new-item-demo-smoke.js | PASS |
| requester-draft-state-smoke.js | PASS，含未完成表單 reload recovery |
| price-routing-smoke.js | PASS |
| global-ui-audit.js | PASS |
| accessibility-smoke.js | PASS |
| layout-smoke.js | FAIL，OM Quote Result row height |
| role-flow-smoke.js | FAIL，Cost Manager shell missing Review History |

使用 PowerShell 設定 `$env:DEMO_BROWSER_CHANNEL='msedge'`，執行 bash test.sh；因標準腳本在 layout failure 停止，其後各 browser script 另行逐項執行，未將未跑到的步驟視為通過。

## 尚待處理

- OM Quote Result 第 2/3/4/10 列為 126/121/121/121 px，超出測試的 118 px 上限。此次未修改使用者鎖定的 Excel-like 列高。
- Cost Manager Review History 的導覽位置與舊流程測試不一致；該 suite 到此停止，其後步驟尚未驗證。
- 所有保存皆限同一瀏覽器／來源，不等於後端持久化；後續其他角色狀態跨刷新同步不在本輪實作範圍。

結論：新增品項與草稿相關回歸通過；完整專案仍有上述兩項未通過，不宣稱全綠。
