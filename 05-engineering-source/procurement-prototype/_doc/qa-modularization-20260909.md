# 2026-09-09 全專案模組拆分驗證

## 結論與範圍

原 app.js 的 27,417 行業務程式已移至 209 個具名前端模組；app.js 保留 6 行入口。原 server.js 的 2,394 行已分成 42 個後端 runtime modules，保留 11 行入口。這是全專案 implementation ownership 拆分，不是重新定義業務資料模型或宣稱完全消除所有跨 domain coupling。

保持英文 UI、Excel-like 表格與計算、角色權限、API/SQL 搜尋語意、Demo localStorage。沒有使用 Git、修改真實資料庫或部署。既有 app-modules、獨立 extension 與 seed 資料檔沿用；未刪除舊資料或使用者文件。

## Fresh verification

| 檢查 | 結果／證據 |
| --- | --- |
| 前後端 module syntax | 251 個 JS 檔案通過；entry syntax 同標準套件檢查 |
| Reproducible build | npm run build:check 通過；209 個輸入 modules |
| Runtime artifact guard | Node built-ins SHA-256 驗證通過；可在 omit-dev 環境執行；guard mutation test 通過 |
| Unit / system / API | 159 / 159 通過（拆分前 151） |
| Browser entry | 通過，Edge headless、file preview |
| New item demo | 通過；搜尋、選取、輸入、pending demand、0 qty、mobile |
| Requester drafts | 通過；草稿、重載、提交不重複、刪除不復活、隔離、儲存錯誤 |
| HTTP module integration | 通過；real HTTP + browser、bundle 200、login/session、Catalog → demand；使用隔離 memory backend，不是 MySQL E2E |
| Price routing | 通過 |
| Global UI / Accessibility | 各自獨立執行通過 |
| Layout | **失敗，與拆分前相同**：OM Quote Result row 2 = 126px，rows 3/4/10 = 121px，超過 118px |
| Role flow | **失敗，與拆分前相同**：Cost Manager shell missing /Review History/ |
| 八角色前後比較 | Requester、DRI、Cost Manager、Budget Approver、OM Leader、OM Purchasing、Admin、Buyer 的 rendered text、可見表格欄位／欄寬／列數一致；兩側皆無 pageerror |
| 搜尋畫面前後截圖 | PNG SHA-256 完全一致：7eaed334420b4afc860987d28f44b39b92bab68d809bc76e1be3bd0752eb5ad3 |
| SQL 靜態比對 | 21 個 SQL query 字串保持一致；backend worker 另比對完整 calls／bind expressions（忽略排版空白） |

`./test.sh` 是 fail-fast：已跑到 layout 後返回 exit 1。後續 price/global/role/accessibility 已分別補跑，不把未執行項目當成通過。HTTP smoke 加入標準流程的時間晚於該次啟動，故另以 main-thread `node tests/http-module-smoke.js` 驗證。

## 檔案與證據

- [完整 module map](../docs/module-map.md)
- [最小上下文](../_context/modules/project-modularization.zh-TW.md)
- [後端 module map](backend-module-map.md)
- `test-artifacts/modularization-final-standard.log`
- `test-artifacts/modularization-final-price-routing-smoke.log`
- `test-artifacts/modularization-final-global-ui-audit.log`
- `test-artifacts/modularization-final-role-flow-smoke.log`
- `test-artifacts/modularization-final-accessibility-smoke.log`
- `test-artifacts/modularization-parity/report.json` 與各 role JSON
- `test-artifacts/modularization-parity/before-search.png`、`after-search.png`
- 原始可還原備份：`test-artifacts/modularization-backup/frontend/`、`backend/server.js`。恢復前須先保留後续修改；不是自動覆蓋指示。

## 維護與保留風險

- 修改 src 後執行 `npm run build`，再 `npm run build:check`、標準測試。dist 不手改；npm start / Docker build 會以 hash guard 拒絕過期 artifact。
- Import/export、owner setters 和事件 handlers 明確化，但既有 request row 仍跨流程共享；setter 不等於有權限／validation／transaction 的業務 command。
- Module map 記錄 5 個既有未定義 integration references，以及 optional formatCurrency fallback；未在本輪改寫其業務行為。
- esbuild 揭露 `suggestionToRecord` 既有重複 source key；保留原本最後一個 key 勝出的語意，未順便修正。
- npm audit 報告既有 mysql2 一項 moderate advisory；本輪不自動升級 runtime driver。此項不是新增模組功能，也未宣稱已修復。
- 未執行真實 MySQL E2E、Docker image build 或部署。SQL 等價比對／memory API tests 不代替這些證據。

## Multi-agent receipt

主線：前端抽取、build/compat、整合、HTTP／八角色 parity 與交付。Backend worker：42 後端 modules、events 拆分；QA worker：baseline、來源契約 reader、module docs；獨立 reviewer：SQL/API/static/compat 審查與最終標準／browser suites。結果已由主線檢視、重跑必要驗證；沒有外部寫入或 Git 操作。
