# 後端模組維護地圖

本輪僅移動 implementation boundary；API URL、權限、回傳 shape、SQL／bind arguments、登入測試角色、記憶體 fallback 與 static allowlist 均保留既有語意。沒有新增業務能力、修改資料庫或部署。

## Entry 與生命週期

- `server.js`：11 行 process entry，保留 `createServer`、`memoryStore`、`publicUser` 三個原有 CommonJS exports，只有直接執行時 listen。
- `server-modules/application.js`：唯一 composition root，明列每個 factory 的 dependencies；route handlers 以 handled boolean 回報是否已回應，集中處理 404／錯誤。
- `config.js`：以 prototype root 讀 `.env`，既有 process environment 優先，static／upload root 不因模組搬移而偏移。
- `database.js`：每個 application 建立一個 pool；預設 `server.js` 在 require 時建立一次，後續 `createServer()` 共用它，與舊版相同。HTTP server close 不新增 pool disposal 行為。測試可傳入 `pool: null` 強制記憶體模式或傳入隔離的 pool double；pool 的關閉仍屬 process／呼叫端責任。
- `memory-store.js`：每個 application 自己的 seed users、sessions、assignment／calendar／tracking／audit／catalog state。工廠間傳入明確的 store reference，沒有跨 application singleton 或 global context proxy。

## Feature / Function / Module

| Feature（角色） | Function 保持不變 | Module 維護邊界 |
| --- | --- | --- |
| Session（全角色） | login、logout、me、server-authoritative role、session revoke、cookie | `auth-routes`、`session-service`、`session-repository`、`user-repository`、`user-model` |
| HTTP／Static（全角色） | JSON、multipart、body limit、runtime asset allowlist、workspace preview prefix | `http-body`、`static-assets`、`config` |
| Admin governance（Admin） | user lifecycle/import/export、roles、permissions、field visibility、audit | `admin-routes`、`admin-service`、`user-repository`、`audit-repository` |
| Catalog（Requester／內部角色） | Lv123 taxonomy、既有 search/filter、內部物料欄位 visibility | `catalog-routes`、`catalog-service`、`catalog-repository`、`catalog-filter` |
| SAP PO raw import（Admin） | status、preview、commit、receipt/audit | `import-routes`、`import-service`；沿用原 `app-modules/sap-po-raw-importer` |
| Workflow evidence（DRI／Cost／Budget／Admin） | scope SQL、grouping、quantity／date mapping | `workflow-routes`、`workflow-repository`、`workflow-model` |
| Attachments（既有角色權限） | multipart upload、disk bytes、metadata、download/audit | `attachment-routes`、`attachment-service`、`attachment-repository`、`attachment-model` |
| OM assignment（Leader／Admin；Purchasing read） | assign／clear、assignees、assignment rules | `assignment-routes`、`assignment-service`、`assignment-repository`、`om-models` |
| Project Stage Calendar（Leader／Admin write） | normalized phase/date、upsert、audit | `calendar-routes`、`calendar-service`、`calendar-repository`、`om-models` |
| Procurement Tracking（Purchasing／Admin write） | allowed patch fields、blank handling、upsert、audit | `tracking-routes`、`tracking-service`、`tracking-repository`、`om-models` |
| OM Leader Console（Leader／Admin） | rows + calendar + tracking authoritative payload | `leader-routes`、`leader-service`、`leader-repository` |

表內省略 `.js`。所有新模組均位於 `server-modules/`。Pure transformations 放在 `*-model(s)`、`values`、`permissions`、`catalog-filter`；服務只接收需要的 repository methods／audit／state，不讀取隱藏 shared closure。SQL repository 保留原 SQL 及 bind expressions，業務驗證、fallback、audit 呼叫順序留在服務。

## 修改時的規則

1. Route 改動先確認角色文件與 API contract；domain service 負責業務 validation，repository 負責 SQL execution。
2. 不把 `server-modules` 加入瀏覽器 static allowlist，也不從 frontend require 後端模組。
3. 不用 module-level singleton 快取 application state；material workbook promise 只在該 application 的 catalog service 內。
4. 不在本輪順便修正既有 SQL search/detail、memory fallback、權限或 seed 行為。這些必須獨立 feature/function 授權。
5. `server-modules/_migration/extract-backend.cjs` 是本次搬移的開發用機械轉換紀錄，不在 runtime require graph 中；依賴原始 backup 與開發環境 parser。**後續維護不要重跑**，否則會以搬移前 snapshot 覆蓋已維護的模組。

## 驗證與回復

- 原始 backup：`test-artifacts/modularization-backup/backend/server.js`；以 `Copy-Item` 建立，未刪除原始資料。
- Baseline：`node --test tests/api.test.js`，18/18 通過。
- 模組測試：`node --test tests/backend-modules.test.js tests/api.test.js`，22/22 通過。涵蓋獨立 app state/session、private modules static 404、preview prefix、auth、OM normalizers、calendar SQL bind order／validation／audit、health／pool lifecycle；既有 18 項 API 測試保持原檔。
- 42 個 runtime modules 以 parser 與 free-reference analysis 檢查，沒有遺漏 dependency；21 個完整 SQL calls（含 bind expressions）比對原 backup 保持一致（只忽略排版空白）；entry、42 個 modules、新增 test 檔 syntax 全部通過。
- 完整 `./test.sh` 與 frontend/browser integration 由主線統一執行。Windows 此 shell 無 `bash`，不可把未跑完整套件宣稱為通過。
- 本輪未對真實 MySQL 執行 migration、import 或資料寫入；API integration 使用既有 memory fallback，repository binding 另以受控 pool double 驗證。真實 MySQL E2E 不包含在本次證據內。
